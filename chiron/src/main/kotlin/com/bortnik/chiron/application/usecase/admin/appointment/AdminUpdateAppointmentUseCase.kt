package com.bortnik.chiron.application.usecase.admin.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.appointment.UpdateAppointmentUseCase
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdateAppointmentUseCase(private val updateAppointmentUseCase: UpdateAppointmentUseCase) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, id: UUID, dto: UpdateAppointmentDto): Appointment {
        val appointment = updateAppointmentUseCase.update(id, dto)
        log.info(
            "Admin {} ({}) updated appointment {}: veterinarian {}, {} - {}, status {}",
            actor.userId,
            actor.fullName,
            appointment.id,
            appointment.veterinarianId,
            appointment.startAt,
            appointment.endAt,
            appointment.status,
        )
        return appointment
    }
}
