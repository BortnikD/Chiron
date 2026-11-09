package com.bortnik.chiron.application.security

import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VaccinationNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.vaccination
import com.bortnik.chiron.support.TestEntities.veterinarian
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class ResourceAccessGuardTest {
    private val pets = mock(PetRepository::class.java)
    private val appointments = mock(AppointmentRepository::class.java)
    private val vaccinations = mock(VaccinationRepository::class.java)
    private val veterinarians = mock(VeterinarianRepository::class.java)
    private val guard = ResourceAccessGuard(pets, appointments, vaccinations, veterinarians)
    private val owner = Actor(pet.ownerId, UserRole.CLIENT, "Owner")
    private val vet = Actor(veterinarian.userId, UserRole.VETERINARIAN, "Veterinarian")

    @Test
    fun `appointment and vaccination ownership follows the pet owner`() {
        `when`(appointments.findById(appointment.id)).thenReturn(appointment)
        `when`(vaccinations.findById(vaccination.id)).thenReturn(vaccination)
        `when`(pets.findById(pet.id)).thenReturn(pet)
        assertEquals(appointment, guard.requireOwnedAppointment(owner, appointment.id))
        assertEquals(vaccination, guard.requireOwnedVaccination(owner, vaccination.id))

        val stranger = owner.copy(userId = UUID.randomUUID())
        assertFailsWith<AccessDeniedException> { guard.requireOwnedAppointment(stranger, appointment.id) }
        assertFailsWith<AccessDeniedException> { guard.requireOwnedVaccination(stranger, vaccination.id) }
    }

    @Test
    fun `assigned appointment uses profile id rather than user id`() {
        `when`(veterinarians.findByUserId(vet.userId)).thenReturn(veterinarian)
        `when`(appointments.findById(appointment.id)).thenReturn(appointment)
        assertEquals(appointment, guard.requireAssignedAppointment(vet, appointment.id))

        `when`(appointments.findById(appointment.id)).thenReturn(appointment.copy(veterinarianId = vet.userId))
        assertFailsWith<AccessDeniedException> { guard.requireAssignedAppointment(vet, appointment.id) }
    }

    @Test
    fun `patient and vaccination access requires at least one appointment with the veterinarian`() {
        `when`(veterinarians.findByUserId(vet.userId)).thenReturn(veterinarian)
        `when`(pets.findById(pet.id)).thenReturn(pet)
        `when`(vaccinations.findById(vaccination.id)).thenReturn(vaccination)
        for (history in listOf(emptyList(), listOf(appointment.copy(veterinarianId = vet.userId)))) {
            `when`(appointments.findAllByPetId(pet.id)).thenReturn(history)
            assertFailsWith<AccessDeniedException> { guard.requirePatient(vet, pet.id) }
            assertFailsWith<AccessDeniedException> { guard.requirePatientVaccination(vet, vaccination.id) }
        }
        `when`(appointments.findAllByPetId(pet.id)).thenReturn(listOf(appointment))
        assertEquals(pet, guard.requirePatient(vet, pet.id))
        assertEquals(vaccination, guard.requirePatientVaccination(vet, vaccination.id))
    }

    @Test
    fun `missing resources and veterinarian profiles have typed failures`() {
        assertFailsWith<AppointmentNotFoundException> { guard.requireOwnedAppointment(owner, appointment.id) }
        assertFailsWith<VaccinationNotFoundException> { guard.requireOwnedVaccination(owner, vaccination.id) }
        assertFailsWith<PetNotFoundException> { guard.requirePatient(vet, pet.id) }
        assertFailsWith<VeterinarianNotFoundException> { guard.requireVeterinarian(vet) }
        `when`(appointments.findById(appointment.id)).thenReturn(appointment)
        assertFailsWith<VeterinarianNotFoundException> { guard.requireAssignedAppointment(vet, appointment.id) }
    }
}
