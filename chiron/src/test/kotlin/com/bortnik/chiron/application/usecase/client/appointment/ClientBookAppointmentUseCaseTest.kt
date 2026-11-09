package com.bortnik.chiron.application.usecase.client.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.appointment.CreateAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.notification.NotifyAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.service.GetServiceUseCase
import com.bortnik.chiron.domain.dto.appointment.BookAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.entities.Service
import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.Gender
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class ClientBookAppointmentUseCaseTest {
    private val create = mock(CreateAppointmentUseCase::class.java)
    private val services = mock(GetServiceUseCase::class.java)
    private val access = mock(ResourceAccessGuard::class.java)
    private val notifications = mock(NotifyAppointmentUseCase::class.java)
    private val species = mock(ServiceSpeciesRepository::class.java)
    private val now = Instant.parse("2026-11-08T09:00:00Z")
    private val actor = Actor(UUID.randomUUID(), UserRole.CLIENT, "I. Petrov")
    private val pet = Pet(
        UUID.randomUUID(), "Pet", actor.userId, UUID.randomUUID(), gender = Gender.MALE,
        createdAt = now, updatedAt = now,
    )
    private val service = Service(
        UUID.randomUUID(), UUID.randomUUID(), "Visit", "Examination", 100.0, 60,
        bufferAfterMin = 15, createdAt = now, updatedAt = now,
    )
    private val veterinarianId = UUID.randomUUID()
    private val start = now.plusSeconds(3600)
    private val useCase = ClientBookAppointmentUseCase(
        create, services, access, notifications, species,
        Clock.fixed(now, ZoneOffset.UTC),
    )

    @Test
    fun `booking uses species duration and price overrides including the service buffer`() {
        allowService(ServiceSpecies(service.id, pet.speciesId, durationMin = 30, price = 80.0))
        assertBooking(durationMinutes = 45, price = 80.0)
    }

    @Test
    fun `booking falls back to base duration and price including the service buffer`() {
        allowService(ServiceSpecies(service.id, pet.speciesId))
        assertBooking(durationMinutes = 75, price = 100.0)
    }

    @Test
    fun `shortened and extended service durations are rejected without creating an appointment`() {
        allowService(ServiceSpecies(service.id, pet.speciesId))
        for (minutes in listOf(1L, 60L, 76L)) {
            val ex = assertFailsWith<ValidationException> { useCase.book(actor, booking(start, minutes)) }
            assertEquals(listOf("endAt"), ex.errors.map { it.field })
        }
        verifyNoInteractions(create, notifications)
    }

    @Test
    fun `past and current start times are rejected before accessing resources`() {
        for (startAt in listOf(now.minusSeconds(1), now)) {
            val ex = assertFailsWith<ValidationException> { useCase.book(actor, booking(startAt, 75)) }
            assertEquals(listOf("startAt"), ex.errors.map { it.field })
        }
        verifyNoInteractions(create, notifications, access, services, species)
    }

    private fun allowService(override: ServiceSpecies) {
        `when`(access.requireOwnedPet(actor, pet.id)).thenReturn(pet)
        `when`(services.findById(service.id)).thenReturn(service)
        `when`(species.findById(service.id, pet.speciesId)).thenReturn(override)
    }

    private fun assertBooking(durationMinutes: Long, price: Double) {
        val dto = booking(start, durationMinutes)
        val expected = CreateAppointmentDto(
            veterinarianId, pet.id, service.id, startAt = start,
            endAt = dto.endAt, priceSnapshot = price,
        )
        val appointment = Appointment(
            UUID.randomUUID(), veterinarianId, pet.id, service.id,
            startAt = start, endAt = dto.endAt, status = AppointmentStatus.PENDING, priceSnapshot = price,
            createdAt = now, updatedAt = now,
        )
        `when`(create.create(expected)).thenReturn(appointment)

        assertEquals(appointment, useCase.book(actor, dto))

        verify(create).create(expected)
        verify(notifications).notifyChange(actor.userId, null, appointment)
    }

    private fun booking(startAt: Instant, durationMinutes: Long) = BookAppointmentDto(
        veterinarianId, pet.id, service.id, startAt, startAt.plusSeconds(durationMinutes * 60),
    )
}
