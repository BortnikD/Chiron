package com.bortnik.chiron.application.usecase.client.vaccination

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.domain.dto.vaccination.ClientVaccinationFilter
import com.bortnik.chiron.domain.dto.vaccination.VaccinationFilter
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.entities.enums.Gender
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class ClientGetVaccinationUseCaseTest {

    private val actor = Actor(UUID.randomUUID(), UserRole.CLIENT, "Client")
    private val pets = mock(PetRepository::class.java)
    private val vaccinations = mock(VaccinationRepository::class.java)
    private val guard = ResourceAccessGuard(
        pets,
        mock(AppointmentRepository::class.java),
        vaccinations,
        mock(VeterinarianRepository::class.java),
    )
    private val useCase = ClientGetVaccinationUseCase(vaccinations, guard)

    @Test
    fun `unfiltered list queries all pets of the current owner in one repository call`() {
        val filter = VaccinationFilter()
        val expected = listOf(vaccination(UUID.randomUUID()), vaccination(UUID.randomUUID()))
        `when`(vaccinations.findAllByOwnerId(actor.userId, filter)).thenReturn(expected)

        assertEquals(expected, useCase.findAll(actor, ClientVaccinationFilter()))

        verify(vaccinations).findAllByOwnerId(actor.userId, filter)
        verifyNoMoreInteractions(vaccinations)
        verifyNoInteractions(pets)
    }

    @Test
    fun `pet filter checks ownership and keeps owner scope in the query`() {
        val pet = pet(actor.userId)
        val filter = VaccinationFilter(petId = pet.id)
        val expected = listOf(vaccination(pet.id))
        `when`(pets.findById(pet.id)).thenReturn(pet)
        `when`(vaccinations.findAllByOwnerId(actor.userId, filter)).thenReturn(expected)

        assertEquals(expected, useCase.findAll(actor, ClientVaccinationFilter(petId = pet.id)))

        verify(pets).findById(pet.id)
        verify(vaccinations).findAllByOwnerId(actor.userId, filter)
        verifyNoMoreInteractions(pets, vaccinations)
    }

    @Test
    fun `single day and one sided due date ranges are accepted and passed to the scoped query`() {
        val date = LocalDate.of(2026, 11, 8)
        val filters = listOf(
            ClientVaccinationFilter(nextDueFrom = date, nextDueTo = date),
            ClientVaccinationFilter(nextDueFrom = date),
            ClientVaccinationFilter(nextDueTo = date),
        )
        for (filter in filters) {
            val scoped = VaccinationFilter(nextDueFrom = filter.nextDueFrom, nextDueTo = filter.nextDueTo)
            `when`(vaccinations.findAllByOwnerId(actor.userId, scoped)).thenReturn(emptyList())

            assertEquals(emptyList(), useCase.findAll(actor, filter))

            verify(vaccinations).findAllByOwnerId(actor.userId, scoped)
        }
        verifyNoMoreInteractions(vaccinations)
        verifyNoInteractions(pets)
    }

    @Test
    fun `reversed due date range is rejected before any repository access`() {
        val date = LocalDate.of(2026, 11, 8)

        val error = assertFailsWith<ValidationException> {
            useCase.findAll(actor, ClientVaccinationFilter(nextDueFrom = date, nextDueTo = date.minusDays(1)))
        }

        assertEquals(listOf("nextDueTo"), error.errors.map { it.field })
        verifyNoInteractions(pets, vaccinations)
    }

    @Test
    fun `another owner's pet is rejected before reading vaccinations`() {
        val pet = pet(UUID.randomUUID())
        `when`(pets.findById(pet.id)).thenReturn(pet)

        assertFailsWith<AccessDeniedException> {
            useCase.findAll(actor, ClientVaccinationFilter(petId = pet.id))
        }

        verify(pets).findById(pet.id)
        verifyNoMoreInteractions(pets)
        verifyNoInteractions(vaccinations)
    }

    @Test
    fun `missing pet is rejected before reading vaccinations`() {
        val petId = UUID.randomUUID()
        `when`(pets.findById(petId)).thenReturn(null)

        assertFailsWith<PetNotFoundException> {
            useCase.findAll(actor, ClientVaccinationFilter(petId = petId))
        }

        verify(pets).findById(petId)
        verifyNoMoreInteractions(pets)
        verifyNoInteractions(vaccinations)
    }

    private fun vaccination(petId: UUID) = Vaccination(
        id = UUID.randomUUID(),
        petId = petId,
        name = "Vaccine",
        administeredOn = LocalDate.of(2025, 11, 8),
        nextDueOn = LocalDate.of(2026, 11, 8),
    )

    private fun pet(ownerId: UUID) = Pet(
        id = UUID.randomUUID(),
        name = "Pet",
        ownerId = ownerId,
        speciesId = UUID.randomUUID(),
        gender = Gender.MALE,
        createdAt = Instant.parse("2026-01-01T10:00:00Z"),
        updatedAt = Instant.parse("2026-01-01T10:00:00Z"),
    )
}
