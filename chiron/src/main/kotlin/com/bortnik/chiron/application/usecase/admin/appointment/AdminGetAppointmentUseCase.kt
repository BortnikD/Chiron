package com.bortnik.chiron.application.usecase.admin.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.appointment.GetAppointmentUseCase
import com.bortnik.chiron.domain.entities.Appointment
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AdminGetAppointmentUseCase(private val getAppointmentUseCase: GetAppointmentUseCase) {

    fun findById(actor: Actor, id: UUID): Appointment = getAppointmentUseCase.findById(id)

    fun findAllByVeterinarianId(actor: Actor, veterinarianId: UUID): List<Appointment> =
        getAppointmentUseCase.findAllByVeterinarianId(veterinarianId)

    fun findAllByPetId(actor: Actor, petId: UUID): List<Appointment> = getAppointmentUseCase.findAllByPetId(petId)
}
