package com.bortnik.chiron.application.usecase.veterinarian.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.appointment.CreateAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.notification.NotifyAppointmentUseCase
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.ScheduleFollowUpDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class VeterinarianScheduleFollowUpUseCase(
    private val createAppointmentUseCase: CreateAppointmentUseCase,
    private val accessGuard: ResourceAccessGuard,
    private val notifyAppointmentUseCase: NotifyAppointmentUseCase,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    fun schedule(actor: Actor, appointmentId: UUID, dto: ScheduleFollowUpDto): Appointment {
        val original = accessGuard.requireAssignedAppointment(actor, appointmentId, forUpdate = true)
        val appointment = createAppointmentUseCase.create(
            CreateAppointmentDto(
                veterinarianId = original.veterinarianId,
                petId = original.petId,
                serviceIds = dto.serviceIds,
                followUpOf = original.id,
                startAt = dto.startAt,
                endAt = dto.endAt,
                status = AppointmentStatus.CONFIRMED,
            ),
            actor.userId,
        )
        notifyAppointmentUseCase.notifyChange(actor, before = null, after = appointment)
        log.info(
            "Veterinarian {} ({}) scheduled follow-up {} of appointment {} for pet {} at {}, estimated total {}",
            actor.userId, actor.fullName, appointment.id, original.id, appointment.petId,
            appointment.startAt, appointment.estimatedTotal,
        )
        return appointment
    }
}
