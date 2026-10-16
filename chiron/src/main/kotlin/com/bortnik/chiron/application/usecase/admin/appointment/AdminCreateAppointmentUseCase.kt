package com.bortnik.chiron.application.usecase.admin.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.appointment.CreateAppointmentUseCase
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateAppointmentUseCase(private val createAppointmentUseCase: CreateAppointmentUseCase) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun create(actor: Actor, dto: CreateAppointmentDto): Appointment {
        val appointment = createAppointmentUseCase.create(dto)
        log.info(
            "Admin {} ({}) created appointment {} for pet {} with veterinarian {} at {}, status {}, price {}",
            actor.userId,
            actor.fullName,
            appointment.id,
            appointment.petId,
            appointment.veterinarianId,
            appointment.startAt,
            appointment.status,
            appointment.priceSnapshot,
        )
        return appointment
    }
}
