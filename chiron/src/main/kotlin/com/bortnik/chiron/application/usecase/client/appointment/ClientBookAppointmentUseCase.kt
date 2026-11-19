package com.bortnik.chiron.application.usecase.client.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.appointment.CreateAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.notification.NotifyAppointmentUseCase
import com.bortnik.chiron.domain.dto.appointment.BookAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.utils.validators.validateAll
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
@Transactional
class ClientBookAppointmentUseCase(
    private val createAppointmentUseCase: CreateAppointmentUseCase,
    private val accessGuard: ResourceAccessGuard,
    private val notifyAppointmentUseCase: NotifyAppointmentUseCase,
    private val clock: Clock,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    fun book(actor: Actor, dto: BookAppointmentDto): Appointment {
        validateAll { ensure(dto.startAt > clock.instant(), "startAt", "must be in the future") }
        accessGuard.requireOwnedPet(actor, dto.petId)
        val appointment = createAppointmentUseCase.create(
            CreateAppointmentDto(
                veterinarianId = dto.veterinarianId,
                petId = dto.petId,
                serviceIds = dto.serviceIds,
                startAt = dto.startAt,
                endAt = dto.endAt,
                clientComment = dto.clientComment,
            ),
            actor.userId,
        )
        notifyAppointmentUseCase.notifyChange(actor, before = null, after = appointment)
        log.info(
            "Client {} ({}) booked appointment {} for pet {} with veterinarian {} at {}, estimated total {}",
            actor.userId, actor.fullName, appointment.id, appointment.petId, appointment.veterinarianId,
            appointment.startAt, appointment.estimatedTotal,
        )
        return appointment
    }
}
