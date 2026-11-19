package com.bortnik.chiron.application.usecase.veterinarian.appointment

import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.security.toActor
import com.bortnik.chiron.application.usecase.common.appointment.CreateAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.notification.NotifyAppointmentUseCase
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.ScheduleFollowUpDto
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.user
import org.junit.jupiter.api.Test
import org.mockito.Mockito.doThrow
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class VeterinarianScheduleFollowUpUseCaseTest {
    private val create = mock(CreateAppointmentUseCase::class.java)
    private val guard = mock(ResourceAccessGuard::class.java)
    private val notifications = mock(NotifyAppointmentUseCase::class.java)
    private val useCase = VeterinarianScheduleFollowUpUseCase(create, guard, notifications)
    private val actor = user.toActor()
    private val request = ScheduleFollowUpDto(
        serviceIds = listOf(UUID.randomUUID(), UUID.randomUUID()),
        startAt = appointment.endAt,
        endAt = appointment.endAt.plusSeconds(3600),
    )

    @Test
    fun `follow-up keeps patient and veterinarian and uses explicitly selected services`() {
        `when`(guard.requireAssignedAppointment(actor, appointment.id, forUpdate = true)).thenReturn(appointment)
        val expected = CreateAppointmentDto(
            appointment.veterinarianId, pet.id, request.serviceIds, followUpOf = appointment.id,
            startAt = request.startAt, endAt = request.endAt, status = AppointmentStatus.CONFIRMED,
        )
        val result = appointment.copy(id = UUID.randomUUID(), followUpOf = appointment.id)
        `when`(create.create(expected, actor.userId)).thenReturn(result)

        assertEquals(result, useCase.schedule(actor, appointment.id, request))

        verify(create).create(expected, actor.userId)
        verify(notifications).notifyChange(actor, null, result)
    }

    @Test
    fun `unassigned original cannot create or notify about a follow-up`() {
        doThrow(AccessDeniedException()).`when`(guard)
            .requireAssignedAppointment(actor, appointment.id, forUpdate = true)
        assertFailsWith<AccessDeniedException> { useCase.schedule(actor, appointment.id, request) }
        verifyNoInteractions(create, notifications)
    }
}
