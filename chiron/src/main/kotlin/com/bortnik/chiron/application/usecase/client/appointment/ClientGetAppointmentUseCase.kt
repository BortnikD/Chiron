package com.bortnik.chiron.application.usecase.client.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.appointment.GetAppointmentUseCase
import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.appointment.ClientAppointmentFilter
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
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

    fun findAll(actor: Actor, filter: ClientAppointmentFilter, pageRequest: PageRequest): Page<Appointment> {
        filter.petId?.let { accessGuard.requireOwnedPet(actor, it) }
        val scoped = AppointmentFilter(
            ownerId = actor.userId,
            petId = filter.petId,
            statuses = filter.statuses,
            from = filter.from,
            to = filter.to,
        )
        return getAppointmentUseCase.findAll(scoped, pageRequest)
    }

    fun findById(actor: Actor, id: UUID): Appointment = accessGuard.requireOwnedAppointment(actor, id)
}
