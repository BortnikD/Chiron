package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.AppointmentPetMismatchException
import com.bortnik.chiron.domain.exceptions.rules.AppointmentSlotUnavailableException
import com.bortnik.chiron.domain.exceptions.rules.FollowUpNotAllowedException
import com.bortnik.chiron.domain.exceptions.rules.PetArchivedException
import com.bortnik.chiron.domain.exceptions.rules.ServiceInactiveException
import com.bortnik.chiron.domain.exceptions.rules.ServiceNotAvailableForSpeciesException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianInactiveException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianNotPermittedForSpeciesException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.service
import com.bortnik.chiron.support.TestEntities.veterinarian
import org.junit.jupiter.api.Test
import org.mockito.Mockito.doThrow
import org.mockito.Mockito.mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class CreateAppointmentUseCaseTest {
    private val appointments = mock(AppointmentRepository::class.java)
    private val pets = mock(PetRepository::class.java)
    private val veterinarians = mock(VeterinarianRepository::class.java)
    private val services = mock(ServiceRepository::class.java)
    private val species = mock(ServiceSpeciesRepository::class.java)
    private val permissions = mock(VeterinarianSpeciesPermissionRepository::class.java)
    private val availability = mock(CheckAppointmentAvailabilityUseCase::class.java)
    private val useCase =
        CreateAppointmentUseCase(appointments, pets, veterinarians, services, species, permissions, availability)
    private val dto = CreateAppointmentDto(
        veterinarian.id,
        pet.id,
        service.id,
        startAt = appointment.startAt,
        endAt = appointment.endAt,
        priceSnapshot = 80.0,
    )

    @Test
    fun `valid booking checks availability and preserves the price snapshot`() {
        allowBooking()
        `when`(appointments.create(dto)).thenReturn(appointment.copy(priceSnapshot = dto.priceSnapshot))
        assertEquals(80.0, useCase.create(dto).priceSnapshot)
        verify(availability).check(veterinarian.id, dto.startAt, dto.endAt, null)
        verify(appointments).create(dto)
    }

    @Test
    fun `archived pet inactive veterinarian and missing species permission prevent booking`() {
        allowBooking()
        `when`(pets.findById(pet.id)).thenReturn(pet.copy(isArchived = true))
        assertFailsWith<PetArchivedException> { useCase.create(dto) }
        `when`(pets.findById(pet.id)).thenReturn(pet)
        `when`(veterinarians.findById(veterinarian.id)).thenReturn(veterinarian.copy(isActive = false))
        assertFailsWith<VeterinarianInactiveException> { useCase.create(dto) }
        `when`(veterinarians.findById(veterinarian.id)).thenReturn(veterinarian)
        `when`(permissions.exists(veterinarian.id, pet.speciesId)).thenReturn(false)
        assertFailsWith<VeterinarianNotPermittedForSpeciesException> { useCase.create(dto) }
        verifyNoInteractions(appointments, availability)
    }

    @Test
    fun `inactive service or unavailable species prevents booking`() {
        allowBooking()
        `when`(services.findById(service.id)).thenReturn(service.copy(isActive = false))
        assertFailsWith<ServiceInactiveException> { useCase.create(dto) }
        `when`(services.findById(service.id)).thenReturn(service)
        `when`(species.findById(service.id, pet.speciesId)).thenReturn(null)
        assertFailsWith<ServiceNotAvailableForSpeciesException> { useCase.create(dto) }
        verifyNoInteractions(appointments, availability)
    }

    @Test
    fun `unavailable slot is rejected without storing an appointment`() {
        allowBooking()
        doThrow(AppointmentSlotUnavailableException(veterinarian.id, dto.startAt, dto.endAt, "Occupied"))
            .`when`(availability).check(veterinarian.id, dto.startAt, dto.endAt, null)
        assertFailsWith<AppointmentSlotUnavailableException> { useCase.create(dto) }
        verifyNoInteractions(appointments)
    }

    @Test
    fun `follow-up rejects missing original another pet and unsupported original statuses`() {
        allowBooking()
        val followUp = dto.copy(
            followUpOf = appointment.id,
            startAt = appointment.endAt,
            endAt = appointment.endAt.plusSeconds(2700)
        )
        assertFailsWith<AppointmentNotFoundException> { useCase.create(followUp) }
        `when`(appointments.findById(appointment.id)).thenReturn(appointment.copy(petId = UUID.randomUUID()))
        assertFailsWith<AppointmentPetMismatchException> { useCase.create(followUp) }
        for (status in listOf(AppointmentStatus.PENDING, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW)) {
            `when`(appointments.findById(appointment.id)).thenReturn(appointment.copy(status = status))
            assertFailsWith<FollowUpNotAllowedException> { useCase.create(followUp) }
        }
        verify(appointments, never()).create(followUp)
        verifyNoInteractions(availability)
    }

    @Test
    fun `follow-up may start exactly at original end but not before it`() {
        allowBooking()
        `when`(appointments.findById(appointment.id)).thenReturn(appointment)
        val followUp = dto.copy(
            followUpOf = appointment.id,
            startAt = appointment.endAt,
            endAt = appointment.endAt.plusSeconds(2700)
        )
        assertFailsWith<FollowUpNotAllowedException> {
            useCase.create(
                followUp.copy(
                    startAt = appointment.endAt.minusSeconds(
                        1
                    )
                )
            )
        }
        for (status in listOf(AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED)) {
            `when`(appointments.findById(appointment.id)).thenReturn(appointment.copy(status = status))
            `when`(appointments.create(followUp)).thenReturn(appointment.copy(followUpOf = appointment.id))
            assertEquals(appointment.id, useCase.create(followUp).followUpOf)
        }
    }

    private fun allowBooking() {
        `when`(pets.findById(pet.id)).thenReturn(pet)
        `when`(veterinarians.findById(veterinarian.id)).thenReturn(veterinarian)
        `when`(services.findById(service.id)).thenReturn(service)
        `when`(species.findById(service.id, pet.speciesId)).thenReturn(ServiceSpecies(service.id, pet.speciesId))
        `when`(permissions.exists(veterinarian.id, pet.speciesId)).thenReturn(true)
    }
}
