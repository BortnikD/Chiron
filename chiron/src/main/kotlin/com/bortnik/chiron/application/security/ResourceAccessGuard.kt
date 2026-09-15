package com.bortnik.chiron.application.security

import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VaccinationNotFoundException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

// Ownership checks for client and veterinarian endpoints; admin endpoints do not use it.
@Service
@Transactional(readOnly = true)
class ResourceAccessGuard(
    private val petRepository: PetRepository,
    private val appointmentRepository: AppointmentRepository,
    private val vaccinationRepository: VaccinationRepository,
) {

    fun requireOwnedPet(ownerId: UUID, petId: UUID): Pet {
        val pet = findPet(petId)
        if (pet.ownerId != ownerId) throw AccessDeniedException("Pet $petId does not belong to the current user")
        return pet
    }

    fun requireOwnedAppointment(ownerId: UUID, appointmentId: UUID): Appointment {
        val appointment = findAppointment(appointmentId)
        requireOwnedPet(ownerId, appointment.petId)
        return appointment
    }

    fun requireOwnedVaccination(ownerId: UUID, vaccinationId: UUID): Vaccination {
        val vaccination = findVaccination(vaccinationId)
        requireOwnedPet(ownerId, vaccination.petId)
        return vaccination
    }

    fun requireAssignedAppointment(veterinarianId: UUID, appointmentId: UUID): Appointment {
        val appointment = findAppointment(appointmentId)
        if (appointment.veterinarianId != veterinarianId) {
            throw AccessDeniedException("Appointment $appointmentId is not assigned to the current veterinarian")
        }
        return appointment
    }

    // A pet is a patient of a veterinarian once it has at least one appointment with them.
    fun requirePatient(veterinarianId: UUID, petId: UUID): Pet {
        val pet = findPet(petId)
        if (appointmentRepository.findAllByPetId(petId).none { it.veterinarianId == veterinarianId }) {
            throw AccessDeniedException("Pet $petId is not a patient of the current veterinarian")
        }
        return pet
    }

    fun requirePatientVaccination(veterinarianId: UUID, vaccinationId: UUID): Vaccination {
        val vaccination = findVaccination(vaccinationId)
        requirePatient(veterinarianId, vaccination.petId)
        return vaccination
    }

    private fun findPet(id: UUID): Pet = petRepository.findById(id) ?: throw PetNotFoundException(id)

    private fun findAppointment(id: UUID): Appointment =
        appointmentRepository.findById(id) ?: throw AppointmentNotFoundException(id)

    private fun findVaccination(id: UUID): Vaccination =
        vaccinationRepository.findById(id) ?: throw VaccinationNotFoundException(id)
}
