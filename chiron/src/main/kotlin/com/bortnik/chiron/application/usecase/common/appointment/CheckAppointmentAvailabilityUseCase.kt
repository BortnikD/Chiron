package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.domain.dto.scheduleexception.ScheduleExceptionFilter
import com.bortnik.chiron.domain.exceptions.rules.AppointmentSlotUnavailableException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import com.bortnik.chiron.domain.repositories.WorkScheduleRepository
import com.bortnik.chiron.domain.utils.VeterinarianAvailability
import com.bortnik.chiron.domain.utils.validators.validateAll
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
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
        validateAll { ensure(endAt > startAt, "endAt", "must be after startAt") }
        val reason = availabilityOf(veterinarianId, startAt, endAt)
            .unavailabilityReason(startAt, endAt, excludeAppointmentId)
        if (reason != null) throw AppointmentSlotUnavailableException(veterinarianId, startAt, endAt, reason)
    }

    fun availabilityOf(
        veterinarianId: UUID, from: Instant, to: Instant,
    ): VeterinarianAvailability = VeterinarianAvailability(
        workSchedules = workScheduleRepository.findAllByVeterinarianId(veterinarianId),
        scheduleExceptions = scheduleExceptionRepository.findAll(
            ScheduleExceptionFilter(
                veterinarianId = veterinarianId,
                from = from.atZone(clinicProperties.zoneId).toLocalDate(),
                to = to.atZone(clinicProperties.zoneId).toLocalDate(),
            ),
        ),
        appointments = appointmentRepository.findOverlapping(veterinarianId, from, to),
        zone = clinicProperties.zoneId,
        slotStepMin = clinicProperties.slotStepMin,
    )
}
