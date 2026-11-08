package com.bortnik.chiron.application.usecase.common.vaccination

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.vaccination.CreateVaccinationDto
import com.bortnik.chiron.domain.dto.vaccination.UpdateVaccinationDto
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.AppointmentPetMismatchException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.now
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.vaccination
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import java.time.Clock
import java.time.ZoneOffset
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class VaccinationConsistencyTest {
    private val repository = mock(VaccinationRepository::class.java)
    private val appointments = mock(AppointmentRepository::class.java)
    private val clock = Clock.fixed(now, ZoneOffset.UTC)
    private val create = CreateVaccinationUseCase(repository, appointments, clock)
    private val update = UpdateVaccinationUseCase(repository, clock)
    private val dto = CreateVaccinationDto(
        pet.id,
        appointment.id,
        vaccination.name,
        vaccination.administeredOn,
        vaccination.nextDueOn
    )

    @Test
    fun `vaccination cannot refer to a missing appointment or an appointment of another pet`() {
        assertFailsWith<AppointmentNotFoundException> { create.create(dto) }
        `when`(appointments.findById(appointment.id)).thenReturn(appointment.copy(petId = UUID.randomUUID()))
        assertFailsWith<AppointmentPetMismatchException> { create.create(dto) }
        verifyNoInteractions(repository)
    }

    @Test
    fun `matching appointment permits vaccination creation`() {
        `when`(appointments.findById(appointment.id)).thenReturn(appointment)
        `when`(repository.create(dto)).thenReturn(vaccination.copy(appointmentId = appointment.id))
        assertEquals(appointment.id, create.create(dto).appointmentId)
    }

    @Test
    fun `next due date must be strictly after administration when creating`() {
        for (date in listOf(vaccination.administeredOn, vaccination.administeredOn.minusDays(1))) {
            assertFailsWith<ValidationException> { create.create(dto.copy(nextDueOn = date)) }
        }
        verifyNoInteractions(repository, appointments)
    }

    @Test
    fun `patch validates changed administration against stored due date and changed due date against stored administration`() {
        `when`(repository.findById(vaccination.id)).thenReturn(vaccination)
        val invalid = listOf(
            UpdateVaccinationDto(administeredOn = vaccination.nextDueOn),
            UpdateVaccinationDto(nextDueOn = Patch.Value(vaccination.administeredOn)),
            UpdateVaccinationDto(nextDueOn = Patch.Value(vaccination.administeredOn.minusDays(1))),
        )
        for (patch in invalid) assertFailsWith<ValidationException> { update.update(vaccination.id, patch) }
        verify(repository, times(invalid.size)).findById(vaccination.id)
        verifyNoMoreInteractions(repository)
    }

    @Test
    fun `patch can clear due date or change both dates to a consistent state`() {
        `when`(repository.findById(vaccination.id)).thenReturn(vaccination)
        for (patch in listOf(
            UpdateVaccinationDto(nextDueOn = Patch.Value(null)),
            UpdateVaccinationDto(
                administeredOn = vaccination.nextDueOn,
                nextDueOn = Patch.Value(vaccination.nextDueOn!!.plusDays(1))
            ),
            UpdateVaccinationDto(),
        )) {
            `when`(repository.update(vaccination.id, patch)).thenReturn(vaccination)
            assertEquals(vaccination, update.update(vaccination.id, patch))
            verify(repository).update(vaccination.id, patch)
        }
    }
}
