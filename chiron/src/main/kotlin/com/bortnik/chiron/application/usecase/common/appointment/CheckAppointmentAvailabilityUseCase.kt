package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import com.bortnik.chiron.domain.exceptions.rules.AppointmentSlotUnavailableException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import com.bortnik.chiron.domain.repositories.WorkScheduleRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalTime
import java.util.UUID

@Service
@Transactional(readOnly = true)
class CheckAppointmentAvailabilityUseCase(
    private val workScheduleRepository: WorkScheduleRepository,
    private val scheduleExceptionRepository: ScheduleExceptionRepository,
    private val appointmentRepository: AppointmentRepository,
    private val clinicProperties: ClinicProperties,
) {

    fun check(veterinarianId: UUID, startAt: Instant, endAt: Instant, excludeAppointmentId: UUID? = null) {
        fun fail(reason: String): Nothing =
            throw AppointmentSlotUnavailableException(veterinarianId, startAt, endAt, reason)

        val zone = clinicProperties.zoneId
        val start = startAt.atZone(zone)
        val end = endAt.atZone(zone)
        val date = start.toLocalDate()
        if (end.toLocalDate() != date) fail("appointment must start and end on the same day")
        if (start.minute % clinicProperties.slotStepMin != 0 || start.second != 0 || start.nano != 0) {
            fail("start time must be aligned to a ${clinicProperties.slotStepMin}-minute grid")
        }
        val startTime = start.toLocalTime()
        val endTime = end.toLocalTime()

        val exceptions = scheduleExceptionRepository.findAllByVeterinarianId(veterinarianId)
            .filter { !date.isBefore(it.startDate) && !date.isAfter(it.endDate) }
        if (exceptions.any { it.type == ScheduleExceptionType.ABSENCE }) fail("veterinarian is absent on $date")

        val customHours = exceptions.firstOrNull { it.type == ScheduleExceptionType.CUSTOM_HOURS }
        if (customHours != null) {
            // CUSTOM_HOURS always carries both times (enforced by the CHECK constraint and the validator).
            if (!within(startTime, endTime, customHours.startTime!!, customHours.endTime!!)) {
                fail("outside custom working hours on $date")
            }
        } else {
            val schedule = workScheduleRepository.findAllByVeterinarianId(veterinarianId)
                .firstOrNull { it.dayOfWeek == date.dayOfWeek }
                ?: fail("veterinarian does not work on ${date.dayOfWeek}")
            if (!within(startTime, endTime, schedule.startTime, schedule.endTime)) {
                fail("outside working hours")
            }
            val breakStart = schedule.breakStart
            val breakEnd = schedule.breakEnd
            if (breakStart != null && breakEnd != null && startTime < breakEnd && endTime > breakStart) {
                fail("overlaps the break")
            }
        }

        val overlapping = appointmentRepository.findAllByVeterinarianId(veterinarianId).any {
            it.id != excludeAppointmentId &&
                    it.status != AppointmentStatus.CANCELLED &&
                    it.startAt < endAt &&
                    it.endAt > startAt
        }
        if (overlapping) fail("overlaps another appointment")
    }

    private fun within(
        startTime: LocalTime,
        endTime: LocalTime,
        windowStart: LocalTime,
        windowEnd: LocalTime
    ): Boolean =
        !startTime.isBefore(windowStart) && !endTime.isAfter(windowEnd)
}
