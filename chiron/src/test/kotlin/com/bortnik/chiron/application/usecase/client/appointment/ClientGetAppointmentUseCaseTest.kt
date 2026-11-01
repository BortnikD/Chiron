package com.bortnik.chiron.application.usecase.client.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.appointment.GetAppointmentUseCase
import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.appointment.AppointmentSortDirection
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.ClientAppointmentFilterRequest
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import org.junit.jupiter.api.Test
import org.mockito.Mockito.doThrow
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import java.time.Instant
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertSame

class ClientGetAppointmentUseCaseTest {

    private val actor = Actor(UUID.randomUUID(), UserRole.CLIENT, "Client")
    private val appointments = mock(AppointmentRepository::class.java)
    private val guard = mock(ResourceAccessGuard::class.java)
    private val useCase = ClientGetAppointmentUseCase(GetAppointmentUseCase(appointments), guard)

    @Test
    fun `omitted direction keeps ascending order and scopes the query to the current owner`() {
        val filter = ClientAppointmentFilterRequest().toDto()
        val scoped = AppointmentFilter(ownerId = actor.userId)
        val page = PageRequest(0, 20)
        val expected = Page<Appointment>(emptyList(), page.page, page.size, 0)
        `when`(appointments.findAll(scoped, page)).thenReturn(expected)

        assertEquals(AppointmentSortDirection.ASC, filter.direction)
        assertSame(expected, useCase.findAll(actor, filter, page))

        verify(appointments).findAll(scoped, page)
        verifyNoMoreInteractions(appointments)
        verifyNoInteractions(guard)
    }

    @Test
    fun `both directions preserve filters and page numbers in the repository query`() {
        val petId = UUID.randomUUID()
        val from = Instant.parse("2026-10-01T00:00:00Z")
        val to = Instant.parse("2026-11-01T00:00:00Z")
        val statuses = setOf(AppointmentStatus.COMPLETED)
        for (direction in AppointmentSortDirection.entries) {
            val request = ClientAppointmentFilterRequest(petId, statuses, from, to, direction)
            val scoped = AppointmentFilter(
                ownerId = actor.userId,
                petId = petId,
                statuses = statuses,
                from = from,
                to = to,
                direction = direction,
            )
            for (number in 0..1) {
                val page = PageRequest(number, 20)
                val expected = Page<Appointment>(emptyList(), number, page.size, 25)
                `when`(appointments.findAll(scoped, page)).thenReturn(expected)

                assertSame(expected, useCase.findAll(actor, request.toDto(), page))

                verify(appointments).findAll(scoped, page)
            }
        }
        verifyNoMoreInteractions(appointments)
    }

    @Test
    fun `descending order does not bypass ownership checks`() {
        val petId = UUID.randomUUID()
        val filter = ClientAppointmentFilterRequest(petId = petId, direction = AppointmentSortDirection.DESC).toDto()
        doThrow(AccessDeniedException()).`when`(guard).requireOwnedPet(actor, petId)

        assertFailsWith<AccessDeniedException> {
            useCase.findAll(actor, filter, PageRequest(0, 20))
        }

        verify(guard).requireOwnedPet(actor, petId)
        verifyNoMoreInteractions(guard)
        verifyNoInteractions(appointments)
    }

    @Test
    fun `invalid pagination is rejected for descending order before querying appointments`() {
        val filter = ClientAppointmentFilterRequest(direction = AppointmentSortDirection.DESC).toDto()

        assertFailsWith<ValidationException> {
            useCase.findAll(actor, filter, PageRequest(-1, 20))
        }

        verifyNoInteractions(appointments, guard)
    }
}
