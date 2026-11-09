package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.exceptions.rules.InvalidAppointmentStatusTransitionException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianInactiveException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianNotPermittedForSpeciesException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.veterinarian
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class UpdateAppointmentUseCaseTest {
    private val appointments = mock(AppointmentRepository::class.java)
    private val pets = mock(PetRepository::class.java)
    private val veterinarians = mock(VeterinarianRepository::class.java)
    private val permissions = mock(VeterinarianSpeciesPermissionRepository::class.java)
    private val availability = mock(CheckAppointmentAvailabilityUseCase::class.java)
    private val useCase = UpdateAppointmentUseCase(appointments, pets, veterinarians, permissions, availability)

    @Test
    fun `rescheduling each time bound or veterinarian checks merged times and excludes the appointment itself`() {
        val other = veterinarian.copy(id = UUID.randomUUID())
        `when`(appointments.findById(appointment.id)).thenReturn(appointment)
        `when`(pets.findById(pet.id)).thenReturn(pet)
        for (vet in listOf(veterinarian, other)) {
            `when`(veterinarians.findById(vet.id)).thenReturn(vet)
            `when`(permissions.exists(vet.id, pet.speciesId)).thenReturn(true)
        }
        for (dto in listOf(
            UpdateAppointmentDto(startAt = appointment.startAt.plusSeconds(900)),
            UpdateAppointmentDto(endAt = appointment.endAt.plusSeconds(900)),
            UpdateAppointmentDto(veterinarianId = other.id),
        )) {
            `when`(appointments.update(appointment.id, dto)).thenReturn(appointment)
            useCase.update(appointment.id, dto)
            verify(availability).check(
                dto.veterinarianId ?: appointment.veterinarianId,
                dto.startAt ?: appointment.startAt,
                dto.endAt ?: appointment.endAt,
                appointment.id,
            )
        }
    }

    @Test
    fun `notes and unchanged schedule do not recheck availability`() {
        val dto = UpdateAppointmentDto(
            veterinarianId = veterinarian.id, startAt = appointment.startAt, endAt = appointment.endAt,
            vetNotes = Patch.Value("Updated notes"),
        )
        `when`(appointments.findById(appointment.id)).thenReturn(appointment)
        `when`(appointments.update(appointment.id, dto)).thenReturn(appointment.copy(vetNotes = "Updated notes"))
        assertEquals("Updated notes", useCase.update(appointment.id, dto).vetNotes)
        verifyNoInteractions(pets, veterinarians, permissions, availability)
    }

    @Test
    fun `inactive or unpermitted veterinarian prevents a write`() {
        val dto = UpdateAppointmentDto(startAt = appointment.startAt.plusSeconds(900))
        `when`(appointments.findById(appointment.id)).thenReturn(appointment)
        `when`(veterinarians.findById(veterinarian.id)).thenReturn(veterinarian.copy(isActive = false))
        assertFailsWith<VeterinarianInactiveException> { useCase.update(appointment.id, dto) }
        `when`(veterinarians.findById(veterinarian.id)).thenReturn(veterinarian)
        `when`(pets.findById(pet.id)).thenReturn(pet)
        assertFailsWith<VeterinarianNotPermittedForSpeciesException> { useCase.update(appointment.id, dto) }
        verify(appointments, times(2)).findById(appointment.id)
        verifyNoMoreInteractions(appointments)
        verifyNoInteractions(availability)
    }

    @Test
    fun `terminal status cannot be reopened`() {
        `when`(appointments.findById(appointment.id)).thenReturn(appointment.copy(status = AppointmentStatus.COMPLETED))
        assertFailsWith<InvalidAppointmentStatusTransitionException> {
            useCase.update(appointment.id, UpdateAppointmentDto(status = AppointmentStatus.CONFIRMED))
        }
        verify(appointments).findById(appointment.id)
        verifyNoMoreInteractions(appointments)
        verifyNoInteractions(availability)
    }
}
