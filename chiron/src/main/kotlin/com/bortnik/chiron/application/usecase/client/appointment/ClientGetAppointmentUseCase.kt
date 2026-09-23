package com.bortnik.chiron.application.usecase.client.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.appointment.GetAppointmentUseCase
import com.bortnik.chiron.domain.entities.Appointment
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class ClientGetAppointmentUseCase(
    private val getAppointmentUseCase: GetAppointmentUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    fun findAll(actor: Actor, petId: UUID?): List<Appointment> {
        if (petId == null) return getAppointmentUseCase.findAllByOwnerId(actor.userId)
        accessGuard.requireOwnedPet(actor, petId)
        return getAppointmentUseCase.findAllByPetId(petId)
    }

    fun findById(actor: Actor, id: UUID): Appointment = accessGuard.requireOwnedAppointment(actor, id)
}
