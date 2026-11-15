package com.bortnik.chiron.application.usecase.admin.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.appointment.GetAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.appointment.UpdateAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.notification.NotifyAppointmentUseCase
import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
@Transactional
class AdminUpdateAppointmentUseCase(
    private val getAppointmentUseCase: GetAppointmentUseCase,
    private val updateAppointmentUseCase: UpdateAppointmentUseCase,
    private val notifyAppointmentUseCase: NotifyAppointmentUseCase,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, id: UUID, dto: UpdateAppointmentDto): Appointment {
        val before = getAppointmentUseCase.findById(id)
        val update = if (dto.status == AppointmentStatus.CANCELLED && before.status != AppointmentStatus.CANCELLED) {
            dto.copy(cancelledBy = Patch.Value(actor.userId), cancelledAt = Patch.Value(Instant.now()))
        } else {
            dto
        }
        val appointment = updateAppointmentUseCase.update(id, update)
        notifyAppointmentUseCase.notifyChange(actor.userId, before = before, after = appointment)
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
