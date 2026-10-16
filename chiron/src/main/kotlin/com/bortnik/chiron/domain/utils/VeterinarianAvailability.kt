package com.bortnik.chiron.domain.utils

import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.util.UUID

// Slot rules of one veterinarian over preloaded data, shared by the single-slot check and the slot search
// so that the search does not query the database for every candidate slot.
class VeterinarianAvailability(
    private val workSchedules: List<WorkSchedule>,
    private val scheduleExceptions: List<ScheduleException>,
    private val appointments: List<Appointment>,
    private val zone: ZoneId,
    private val slotStepMin: Int,
) {

    // Returns why the slot cannot be taken, or null when it is free.
    fun unavailabilityReason(startAt: Instant, endAt: Instant, excludeAppointmentId: UUID? = null): String? {
        val start = startAt.atZone(zone)
        val end = endAt.atZone(zone)
        val date = start.toLocalDate()
        if (end.toLocalDate() != date) return "appointment must start and end on the same day"
        if (start.minute % slotStepMin != 0 || start.second != 0 || start.nano != 0) {
            return "start time must be aligned to a $slotStepMin-minute grid"
        }
        val startTime = start.toLocalTime()
        val endTime = end.toLocalTime()

        val exceptions = scheduleExceptions.filter { !date.isBefore(it.startDate) && !date.isAfter(it.endDate) }
        if (exceptions.any { it.type == ScheduleExceptionType.ABSENCE }) return "veterinarian is absent on $date"

        val customHours = exceptions.firstOrNull { it.type == ScheduleExceptionType.CUSTOM_HOURS }
        if (customHours != null) {
            // CUSTOM_HOURS always carries both times (enforced by the CHECK constraint and the validator).
            if (!within(startTime, endTime, customHours.startTime!!, customHours.endTime!!)) {
                return "outside custom working hours on $date"
            }
        } else {
            val schedule = workSchedules.firstOrNull { it.dayOfWeek == date.dayOfWeek }
                ?: return "veterinarian does not work on ${date.dayOfWeek}"
            if (!within(startTime, endTime, schedule.startTime, schedule.endTime)) {
                return "outside working hours"
            }
            val breakStart = schedule.breakStart
            val breakEnd = schedule.breakEnd
            if (breakStart != null && breakEnd != null && startTime < breakEnd && endTime > breakStart) {
                return "overlaps the break"
            }
        }

        val overlapping = appointments.any {
            it.id != excludeAppointmentId &&
                    it.status != AppointmentStatus.CANCELLED &&
                    it.startAt < endAt &&
                    it.endAt > startAt
        }
        if (overlapping) return "overlaps another appointment"
        return null
    }

    // Candidates follow the same per-hour grid that unavailabilityReason enforces.
    fun freeSlotStarts(date: LocalDate, duration: Duration): List<Instant> =
        (0..23).flatMap { hour -> (0..59 step slotStepMin).map { minute -> LocalTime.of(hour, minute) } }
            .map { date.atTime(it).atZone(zone).toInstant() }
            .filter { unavailabilityReason(it, it + duration) == null }

    private fun within(
        startTime: LocalTime,
        endTime: LocalTime,
        windowStart: LocalTime,
        windowEnd: LocalTime,
    ): Boolean =
        !startTime.isBefore(windowStart) && !endTime.isAfter(windowEnd)
}
