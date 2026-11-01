package com.bortnik.chiron.application.usecase.client.pet

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.pet.GetPetUseCase
import com.bortnik.chiron.domain.dto.pet.PetFilter
import com.bortnik.chiron.domain.dto.pet.PetNextAppointmentDto
import com.bortnik.chiron.domain.dto.pet.PetSummaryDto
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.entities.enums.Gender
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.PetSummaryRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import tools.jackson.databind.json.JsonMapper
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ClientGetPetUseCaseTest {

    private val actor = Actor(UUID.randomUUID(), UserRole.CLIENT, "Client")
    private val pets = mock(PetRepository::class.java)
    private val summaries = mock(PetSummaryRepository::class.java)
    private val now = Instant.parse("2026-11-01T21:30:00Z")
    private val summaryUseCase = ClientGetPetSummaryUseCase(
        summaries,
        ClinicProperties("Europe/Moscow", 15),
        Clock.fixed(now, ZoneOffset.UTC),
    )
    private val guard = ResourceAccessGuard(
        pets,
        mock(AppointmentRepository::class.java),
        mock(VaccinationRepository::class.java),
        mock(VeterinarianRepository::class.java),
    )
    private val useCase = ClientGetPetUseCase(GetPetUseCase(pets), guard, summaryUseCase)
    private val jsonMapper = JsonMapper.builder().build()

    @Test
    fun `list omits summary by default and preserves the existing flat JSON`() {
        val pet = pet()
        val filter = PetFilter(ownerId = actor.userId)
        `when`(pets.findAll(filter)).thenReturn(listOf(pet))

        val result = useCase.findAll(actor, null).single()

        assertNull(result.summary)
        assertEquals(
            jsonMapper.readTree(jsonMapper.writeValueAsString(pet.toResponse())),
            jsonMapper.readTree(jsonMapper.writeValueAsString(result.toResponse())),
        )
        verify(pets).findAll(filter)
        verifyNoMoreInteractions(pets)
        verifyNoInteractions(summaries)
    }

    @Test
    fun `explicit false on details skips summary queries and omits the summary field`() {
        val pet = pet()
        `when`(pets.findById(pet.id)).thenReturn(pet)

        val response = useCase.findById(actor, pet.id, withSummary = false).toResponse()
        val json = jsonMapper.readTree(jsonMapper.writeValueAsString(response))

        assertFalse(json.has("summary"))
        assertFalse(json.has("pet"))
        assertEquals(pet.id.toString(), json["id"].asString())
        verify(pets).findById(pet.id)
        verifyNoMoreInteractions(pets)
        verifyNoInteractions(summaries)
    }

    @Test
    fun `requested summaries load once for selected pets and use the clinic date for overdue status`() {
        val selected = List(5) { pet() }
        val ids = selected.map { it.id }
        val filter = PetFilter(ownerId = actor.userId, isArchived = false)
        val nextAppointment = PetNextAppointmentDto(UUID.randomUUID(), now, UUID.randomUUID())
        `when`(pets.findAll(filter)).thenReturn(selected)
        `when`(summaries.findAll(actor.userId, ids, now)).thenReturn(
            mapOf(
                ids[0] to PetSummaryDto(2, 7, 3, nextAppointment, LocalDate.of(2026, 11, 1)),
                ids[1] to PetSummaryDto(nextVaccinationDueOn = LocalDate.of(2026, 11, 2)),
                ids[2] to PetSummaryDto(nextVaccinationDueOn = LocalDate.of(2026, 11, 3)),
                ids[3] to PetSummaryDto(vaccinationsCount = 1),
            ),
        )

        val result = useCase.findAll(actor, false, withSummary = true)

        assertEquals(ids, result.map { it.pet.id })
        assertEquals(listOf(true, false, false, false, false), result.map { it.summary!!.hasOverdueVaccination })
        assertEquals(2L, result[0].summary!!.completedVisits)
        assertEquals(7L, result[0].summary!!.appointmentsCount)
        assertEquals(3L, result[0].summary!!.vaccinationsCount)
        assertEquals(nextAppointment, result[0].summary!!.nextAppointment)
        assertEquals(PetSummaryDto(), result[4].summary)
        val json = jsonMapper.readTree(jsonMapper.writeValueAsString(result[0].toResponse()))
        assertTrue(json.has("summary"))
        assertFalse(json.has("pet"))
        assertEquals(nextAppointment.id.toString(), json["summary"]["nextAppointment"]["id"].asString())
        verify(pets).findAll(filter)
        verify(summaries).findAll(actor.userId, ids, now)
        verifyNoMoreInteractions(pets, summaries)
    }

    @Test
    fun `requested details load summary only for the owned pet`() {
        val pet = pet()
        `when`(pets.findById(pet.id)).thenReturn(pet)
        `when`(summaries.findAll(actor.userId, listOf(pet.id), now)).thenReturn(emptyMap())

        val response = useCase.findById(actor, pet.id, withSummary = true).toResponse()
        val summary = requireNotNull(response.summary)

        assertEquals(0L, summary.appointmentsCount)
        assertNull(summary.nextAppointment)
        assertNull(summary.nextVaccinationDueOn)
        assertFalse(summary.hasOverdueVaccination)
        verify(pets).findById(pet.id)
        verify(summaries).findAll(actor.userId, listOf(pet.id), now)
        verifyNoMoreInteractions(pets, summaries)
    }

    @Test
    fun `empty pet list skips summary loading even when requested`() {
        val filter = PetFilter(ownerId = actor.userId, isArchived = true)
        `when`(pets.findAll(filter)).thenReturn(emptyList())

        assertEquals(emptyList(), useCase.findAll(actor, true, withSummary = true))

        verify(pets).findAll(filter)
        verifyNoMoreInteractions(pets)
        verifyNoInteractions(summaries)
    }

    @Test
    fun `another owner's pet is rejected before summary loading`() {
        val pet = pet().copy(ownerId = UUID.randomUUID())
        `when`(pets.findById(pet.id)).thenReturn(pet)

        assertFailsWith<AccessDeniedException> { useCase.findById(actor, pet.id, withSummary = true) }

        verify(pets).findById(pet.id)
        verifyNoMoreInteractions(pets)
        verifyNoInteractions(summaries)
    }

    private fun pet() = Pet(
        id = UUID.randomUUID(),
        name = "Pet",
        ownerId = actor.userId,
        speciesId = UUID.randomUUID(),
        gender = Gender.MALE,
        createdAt = now,
        updatedAt = now,
    )
}
