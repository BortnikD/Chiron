package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetAppointmentUseCase(
    private val appointmentRepository: AppointmentRepository,
    private val petRepository: PetRepository,
) {

    fun findById(id: UUID): Appointment = appointmentRepository.findById(id) ?: throw AppointmentNotFoundException(id)

    fun findAllByVeterinarianId(veterinarianId: UUID): List<Appointment> =
        appointmentRepository.findAllByVeterinarianId(veterinarianId)

    fun findAllByPetId(petId: UUID): List<Appointment> = appointmentRepository.findAllByPetId(petId)

    fun findAllByOwnerId(ownerId: UUID): List<Appointment> =
        petRepository.findAllByOwnerId(ownerId).flatMap { appointmentRepository.findAllByPetId(it.id) }
}
