package com.bortnik.chiron.application.usecase.veterinarian.appointment

import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.security.toActor
import com.bortnik.chiron.application.usecase.common.appointment.CreateAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.notification.NotifyAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.pet.GetPetUseCase
import com.bortnik.chiron.application.usecase.common.service.GetServiceUseCase
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
    private val pets = mock(GetPetUseCase::class.java)
    private val services = mock(GetServiceUseCase::class.java)
    private val guard = mock(ResourceAccessGuard::class.java)
    private val notifications = mock(NotifyAppointmentUseCase::class.java)
    private val useCase = VeterinarianScheduleFollowUpUseCase(create, pets, services, guard, notifications)
    private val actor = user.toActor()
    private val request = ScheduleFollowUpDto(startAt = appointment.endAt, endAt = appointment.endAt.plusSeconds(3600))

    @Test
    fun `follow-up keeps original patient and veterinarian confirms immediately and freezes species price`() {
        `when`(guard.requireAssignedAppointment(actor, appointment.id)).thenReturn(appointment)
        `when`(pets.findById(pet.id)).thenReturn(pet)
        for (serviceId in listOf(null, UUID.randomUUID())) {
            val selected = serviceId ?: appointment.serviceId
            `when`(services.findPriceForSpecies(selected, pet.speciesId)).thenReturn(75.0)
            val expected = CreateAppointmentDto(
                appointment.veterinarianId,
                pet.id,
                selected,
                followUpOf = appointment.id,
                startAt = request.startAt,
                endAt = request.endAt,
                status = AppointmentStatus.CONFIRMED,
                priceSnapshot = 75.0,
            )
            val result = appointment.copy(id = UUID.randomUUID(), followUpOf = appointment.id)
            `when`(create.create(expected)).thenReturn(result)
            assertEquals(result, useCase.schedule(actor, appointment.id, request.copy(serviceId = serviceId)))
            verify(create).create(expected)
            verify(notifications).notifyChange(actor.userId, null, result)
        }
    }

    @Test
    fun `unassigned original cannot create or notify about a follow-up`() {
        doThrow(AccessDeniedException()).`when`(guard).requireAssignedAppointment(actor, appointment.id)
        assertFailsWith<AccessDeniedException> { useCase.schedule(actor, appointment.id, request) }
        verifyNoInteractions(create, pets, services, notifications)
    }
}
