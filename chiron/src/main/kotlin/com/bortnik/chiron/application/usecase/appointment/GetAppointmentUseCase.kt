package com.bortnik.chiron.application.usecase.appointment

import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetAppointmentUseCase(private val appointmentRepository: AppointmentRepository) {

    fun findById(id: UUID): Appointment = appointmentRepository.findById(id) ?: throw AppointmentNotFoundException(id)

    fun findAllByVeterinarianId(veterinarianId: UUID): List<Appointment> =
        appointmentRepository.findAllByVeterinarianId(veterinarianId)

    fun findAllByPetId(petId: UUID): List<Appointment> = appointmentRepository.findAllByPetId(petId)
}
