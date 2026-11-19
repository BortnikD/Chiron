package com.bortnik.chiron.application.usecase.client.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.appointment.CreateAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.notification.NotifyAppointmentUseCase
import com.bortnik.chiron.domain.dto.appointment.BookAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.now
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.service
import com.bortnik.chiron.support.TestEntities.veterinarian
import org.junit.jupiter.api.Test
import org.mockito.Mockito.doThrow
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.time.Clock
import java.time.ZoneOffset
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class ClientBookAppointmentUseCaseTest {
    private val create = mock(CreateAppointmentUseCase::class.java)
    private val access = mock(ResourceAccessGuard::class.java)
    private val notifications = mock(NotifyAppointmentUseCase::class.java)
    private val actor = Actor(pet.ownerId, UserRole.CLIENT, "Client")
    private val useCase = ClientBookAppointmentUseCase(create, access, notifications, Clock.fixed(now, ZoneOffset.UTC))
    private val dto = BookAppointmentDto(
        veterinarian.id, pet.id, listOf(service.id, UUID.randomUUID()), appointment.startAt, appointment.endAt,
        clientComment = "Please examine the pet",
    )

    @Test
    fun `booking forwards the complete service selection and author to shared creation`() {
        `when`(access.requireOwnedPet(actor, pet.id)).thenReturn(pet)
        val expected = CreateAppointmentDto(
            veterinarian.id, pet.id, dto.serviceIds, startAt = dto.startAt, endAt = dto.endAt,
            clientComment = dto.clientComment,
        )
        `when`(create.create(expected, actor.userId)).thenReturn(appointment)

        assertEquals(appointment, useCase.book(actor, dto))

        verify(create).create(expected, actor.userId)
        verify(notifications).notifyChange(actor, null, appointment)
    }

    @Test
    fun `another clients pet cannot be booked`() {
        doThrow(AccessDeniedException()).`when`(access).requireOwnedPet(actor, pet.id)

        assertFailsWith<AccessDeniedException> { useCase.book(actor, dto) }

        verifyNoInteractions(create, notifications)
    }

    @Test
    fun `past and current start times are rejected before accessing resources`() {
        for (startAt in listOf(now.minusSeconds(1), now)) {
            val ex = assertFailsWith<ValidationException> { useCase.book(actor, dto.copy(startAt = startAt)) }
            assertEquals(listOf("startAt"), ex.errors.map { it.field })
        }
        verifyNoInteractions(create, notifications, access)
    }
}
