package com.bortnik.chiron.application.usecase.client.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.appointment.ChangeAppointmentStatusUseCase
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class ClientCancelAppointmentUseCase(
    private val changeAppointmentStatusUseCase: ChangeAppointmentStatusUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    fun cancel(actor: Actor, id: UUID, reason: String?): Appointment {
        val appointment = accessGuard.requireOwnedAppointment(actor, id)
        return changeAppointmentStatusUseCase.change(
            appointment = appointment,
            status = AppointmentStatus.CANCELLED,
            actorId = actor.userId,
            vetNotes = appointment.vetNotes,
            cancelReason = reason,
        )
    }
}
