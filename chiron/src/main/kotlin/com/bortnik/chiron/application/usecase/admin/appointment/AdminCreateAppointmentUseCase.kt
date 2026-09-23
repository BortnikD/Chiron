package com.bortnik.chiron.application.usecase.admin.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.appointment.CreateAppointmentUseCase
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateAppointmentUseCase(private val createAppointmentUseCase: CreateAppointmentUseCase) {

    fun create(actor: Actor, dto: CreateAppointmentDto): Appointment = createAppointmentUseCase.create(dto)
}
