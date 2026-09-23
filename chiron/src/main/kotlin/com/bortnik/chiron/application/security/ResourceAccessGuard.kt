package com.bortnik.chiron.application.security

import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VaccinationNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

// Ownership checks for client and veterinarian use cases; admin use cases do not use it.
@Service
@Transactional(readOnly = true)
class ResourceAccessGuard(
    private val petRepository: PetRepository,
    private val appointmentRepository: AppointmentRepository,
    private val vaccinationRepository: VaccinationRepository,
    private val veterinarianRepository: VeterinarianRepository,
) {

    fun requireOwnedPet(actor: Actor, petId: UUID): Pet {
        val pet = findPet(petId)
        if (pet.ownerId != actor.userId)
            throw AccessDeniedException("Pet $petId does not belong to the current user")
        return pet
    }

    fun requireOwnedAppointment(actor: Actor, appointmentId: UUID): Appointment {
        val appointment = findAppointment(appointmentId)
        requireOwnedPet(actor, appointment.petId)
        return appointment
    }

    fun requireOwnedVaccination(actor: Actor, vaccinationId: UUID): Vaccination {
        val vaccination = findVaccination(vaccinationId)
        requireOwnedPet(actor, vaccination.petId)
        return vaccination
    }

    // Veterinarian endpoints are scoped by the veterinarian profile, which is a separate entity from the user.
    fun requireVeterinarian(actor: Actor): Veterinarian =
        veterinarianRepository.findByUserId(actor.userId)
            ?: throw VeterinarianNotFoundException("userId", actor.userId)

    fun requireAssignedAppointment(actor: Actor, appointmentId: UUID): Appointment {
        val appointment = findAppointment(appointmentId)
        if (appointment.veterinarianId != requireVeterinarian(actor).id) {
            throw AccessDeniedException("Appointment $appointmentId is not assigned to the current veterinarian")
        }
        return appointment
    }

    // A pet is a patient of a veterinarian once it has at least one appointment with them.
    fun requirePatient(actor: Actor, petId: UUID): Pet {
        val pet = findPet(petId)
        val veterinarianId = requireVeterinarian(actor).id
        if (appointmentRepository.findAllByPetId(petId).none { it.veterinarianId == veterinarianId }) {
            throw AccessDeniedException("Pet $petId is not a patient of the current veterinarian")
        }
        return pet
    }

    fun requirePatientVaccination(actor: Actor, vaccinationId: UUID): Vaccination {
        val vaccination = findVaccination(vaccinationId)
        requirePatient(actor, vaccination.petId)
        return vaccination
    }

    private fun findPet(id: UUID): Pet = petRepository.findById(id) ?: throw PetNotFoundException(id)

    private fun findAppointment(id: UUID): Appointment =
        appointmentRepository.findById(id) ?: throw AppointmentNotFoundException(id)

    private fun findVaccination(id: UUID): Vaccination =
        vaccinationRepository.findById(id) ?: throw VaccinationNotFoundException(id)
}
