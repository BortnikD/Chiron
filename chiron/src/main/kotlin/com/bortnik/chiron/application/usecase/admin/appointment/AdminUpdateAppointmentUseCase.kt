package com.bortnik.chiron.application.usecase.admin.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.appointment.UpdateAppointmentUseCase
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdateAppointmentUseCase(private val updateAppointmentUseCase: UpdateAppointmentUseCase) {

    fun update(actor: Actor, id: UUID, dto: UpdateAppointmentDto): Appointment =
        updateAppointmentUseCase.update(id, dto)
}
