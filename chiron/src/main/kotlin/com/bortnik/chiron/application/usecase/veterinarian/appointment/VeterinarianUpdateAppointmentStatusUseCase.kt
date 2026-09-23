package com.bortnik.chiron.application.usecase.veterinarian.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.appointment.ChangeAppointmentStatusUseCase
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentStatusDto
import com.bortnik.chiron.domain.entities.Appointment
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class VeterinarianUpdateAppointmentStatusUseCase(
    private val changeAppointmentStatusUseCase: ChangeAppointmentStatusUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, id: UUID, dto: UpdateAppointmentStatusDto): Appointment {
        val appointment = accessGuard.requireAssignedAppointment(actor, id)
        val updated = changeAppointmentStatusUseCase.change(
            appointment = appointment,
            status = dto.status,
            actorId = actor.userId,
            vetNotes = dto.vetNotes,
            cancelReason = dto.cancelReason,
        )
        log.info(
            "Veterinarian {} ({}) changed status of appointment {}: {} -> {}",
            actor.userId,
            actor.fullName,
            id,
            appointment.status,
            updated.status,
        )
        return updated
    }
}
