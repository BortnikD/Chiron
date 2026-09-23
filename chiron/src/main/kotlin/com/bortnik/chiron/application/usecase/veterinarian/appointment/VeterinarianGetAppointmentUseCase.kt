package com.bortnik.chiron.application.usecase.veterinarian.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.appointment.GetAppointmentUseCase
import com.bortnik.chiron.domain.entities.Appointment
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class VeterinarianGetAppointmentUseCase(
    private val getAppointmentUseCase: GetAppointmentUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    fun findAll(actor: Actor): List<Appointment> =
        getAppointmentUseCase.findAllByVeterinarianId(accessGuard.requireVeterinarian(actor).id)

    fun findById(actor: Actor, id: UUID): Appointment = accessGuard.requireAssignedAppointment(actor, id)
}
