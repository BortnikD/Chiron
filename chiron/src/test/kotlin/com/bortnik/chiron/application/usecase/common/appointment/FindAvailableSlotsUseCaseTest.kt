package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.domain.dto.appointment.AvailableSlotFilter
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.domain.entities.Species
import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.domain.exceptions.rules.ServiceInactiveException
import com.bortnik.chiron.domain.exceptions.rules.ServiceNotAvailableForSpeciesException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianInactiveException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianNotPermittedForSpeciesException
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import com.bortnik.chiron.domain.utils.VeterinarianAvailability
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.service
import com.bortnik.chiron.support.TestEntities.veterinarian
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.time.Duration
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class FindAvailableSlotsUseCaseTest {
    private val species = mock(SpeciesRepository::class.java)
    private val services = mock(ServiceRepository::class.java)
    private val overrides = mock(ServiceSpeciesRepository::class.java)
    private val vets = mock(VeterinarianRepository::class.java)
    private val permissions = mock(VeterinarianSpeciesPermissionRepository::class.java)
    private val availability = mock(CheckAppointmentAvailabilityUseCase::class.java)
    private val clinic = ClinicProperties("Europe/Moscow", 15)
    private val useCase =
        FindAvailableSlotsUseCase(species, services, overrides, vets, permissions, availability, clinic)
    private val date = LocalDate.now(clinic.zoneId).plusDays(2)
    private val filter = AvailableSlotFilter(pet.speciesId, service.id, from = date, to = date)

    @Test
    fun `clinic search merges veterinarians sorts slots and includes species duration plus buffer`() {
        allowService(duration = 15)
        val other = veterinarian.copy(id = UUID.randomUUID())
        val query = VeterinarianFilter(speciesId = pet.speciesId, isActive = true)
        `when`(vets.findAll(query)).thenReturn(listOf(other, veterinarian))
        allowHours(other.id, date, 10, 11)
        allowHours(veterinarian.id, date, 9, 11)
        val slots = useCase.find(filter)
        assertEquals(listOf(9 to 0, 9 to 15, 9 to 30, 9 to 45, 10 to 0, 10 to 15, 10 to 30), slots.map {
            val local = it.startAt.atZone(clinic.zoneId)
            local.hour to local.minute
        })
        assertTrue(slots.all { Duration.between(it.startAt, it.endAt) == Duration.ofMinutes(30) })
        assertEquals(listOf(veterinarian.id), slots.first().veterinarianIds)
        assertEquals(listOf(other.id, veterinarian.id), slots.last().veterinarianIds)
        verify(vets).findAll(query)
    }

    @Test
    fun `base duration is used when no species duration override exists`() {
        allowService(duration = null)
        `when`(vets.findById(veterinarian.id)).thenReturn(veterinarian)
        `when`(permissions.exists(veterinarian.id, pet.speciesId)).thenReturn(true)
        allowHours(veterinarian.id, date, 9, 10)
        val slots = useCase.find(filter.copy(veterinarianId = veterinarian.id))
        assertEquals(2, slots.size)
        assertTrue(slots.all { it.endAt == it.startAt.plusSeconds(45 * 60) })
    }

    @Test
    fun `past dates return no slots`() {
        allowService(duration = 15)
        val past = date.minusDays(4)
        `when`(vets.findById(veterinarian.id)).thenReturn(veterinarian)
        `when`(permissions.exists(veterinarian.id, pet.speciesId)).thenReturn(true)
        allowHours(veterinarian.id, past, 9, 10)
        assertTrue(useCase.find(filter.copy(veterinarianId = veterinarian.id, from = past, to = past)).isEmpty())
    }

    @Test
    fun `explicit inactive or unpermitted veterinarian is rejected`() {
        allowService(duration = 15)
        val explicit = filter.copy(veterinarianId = veterinarian.id)
        `when`(vets.findById(veterinarian.id)).thenReturn(veterinarian.copy(isActive = false))
        assertFailsWith<VeterinarianInactiveException> { useCase.find(explicit) }
        `when`(vets.findById(veterinarian.id)).thenReturn(veterinarian)
        assertFailsWith<VeterinarianNotPermittedForSpeciesException> { useCase.find(explicit) }
        verifyNoInteractions(availability)
    }

    @Test
    fun `inactive or species incompatible service is rejected before searching veterinarians`() {
        allowService(duration = null)
        `when`(services.findById(service.id)).thenReturn(service.copy(isActive = false))
        assertFailsWith<ServiceInactiveException> { useCase.find(filter) }
        `when`(services.findById(service.id)).thenReturn(service)
        `when`(overrides.findById(service.id, pet.speciesId)).thenReturn(null)
        assertFailsWith<ServiceNotAvailableForSpeciesException> { useCase.find(filter) }
        verifyNoInteractions(vets, availability)
    }

    private fun allowService(duration: Int?) {
        `when`(species.findById(pet.speciesId)).thenReturn(Species(pet.speciesId, "Species"))
        `when`(services.findById(service.id)).thenReturn(service)
        `when`(overrides.findById(service.id, pet.speciesId)).thenReturn(
            ServiceSpecies(
                service.id,
                pet.speciesId,
                durationMin = duration
            )
        )
    }

    private fun allowHours(veterinarianId: UUID, day: LocalDate, start: Int, end: Int) {
        val schedule =
            WorkSchedule(UUID.randomUUID(), veterinarianId, day.dayOfWeek, LocalTime.of(start, 0), LocalTime.of(end, 0))
        `when`(
            availability.availabilityOf(
                veterinarianId,
                day.atStartOfDay(clinic.zoneId).toInstant(),
                day.plusDays(1).atStartOfDay(clinic.zoneId).toInstant(),
            )
        ).thenReturn(VeterinarianAvailability(listOf(schedule), emptyList(), emptyList(), clinic.zoneId, 15))
    }
}
