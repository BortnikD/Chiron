package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.notification.AppointmentNotificationDetails
import com.bortnik.chiron.application.notification.NotificationMessages
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.notification
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.service
import com.bortnik.chiron.support.TestEntities.user
import com.bortnik.chiron.support.TestEntities.veterinarian
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.any
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class NotifyAppointmentUseCaseTest {
    private val pets = mock(PetRepository::class.java)
    private val services = mock(ServiceRepository::class.java)
    private val vets = mock(VeterinarianRepository::class.java)
    private val users = mock(UserRepository::class.java)
    private val create = mock(CreateNotificationUseCase::class.java)
    private val clinic = ClinicProperties("Europe/Moscow", 15)
    private val useCase = NotifyAppointmentUseCase(pets, services, vets, users, create, clinic)
    private val fallback = CreateNotificationDto(pet.ownerId, type = notification.type, title = "Title", body = "Body")

    @Test
    fun `client booking addresses veterinarian user and includes appointment context`() {
        allowContext()
        `when`(create.create(any(CreateNotificationDto::class.java) ?: fallback)).thenReturn(notification)
        useCase.notifyChange(pet.ownerId, null, appointment)
        val captor = ArgumentCaptor.forClass(CreateNotificationDto::class.java)
        verify(create).create(captor.capture() ?: fallback)
        assertEquals(expected(user.id, pet.ownerId, NotificationType.APPOINTMENT_BOOKED), captor.value)
    }

    @Test
    fun `moving between veterinarians notifies owner and both veterinarian users`() {
        allowContext()
        val previous = veterinarian.copy(id = UUID.randomUUID(), userId = UUID.randomUUID())
        val actorId = UUID.randomUUID()
        `when`(vets.findById(previous.id)).thenReturn(previous)
        `when`(create.create(any(CreateNotificationDto::class.java) ?: fallback)).thenReturn(notification)
        useCase.notifyChange(actorId, appointment.copy(veterinarianId = previous.id), appointment)
        val captor = ArgumentCaptor.forClass(CreateNotificationDto::class.java)
        verify(create, times(3)).create(captor.capture() ?: fallback)
        assertEquals(
            setOf(pet.ownerId, user.id, previous.userId).map {
                expected(
                    it,
                    actorId,
                    NotificationType.APPOINTMENT_RESCHEDULED
                )
            }.toSet(),
            captor.allValues.toSet(),
        )
    }

    @Test
    fun `unchanged appointment creates no notifications`() {
        allowContext()
        useCase.notifyChange(pet.ownerId, appointment, appointment)
        verifyNoInteractions(create)
    }

    @Test
    fun `reminder addresses owner without an actor and reports duplicate suppression`() {
        allowContext()
        val dto = expected(pet.ownerId, null, NotificationType.APPOINTMENT_REMINDER)
        `when`(create.createIfAbsent(dto)).thenReturn(notification, null)
        assertTrue(useCase.remind(appointment))
        assertFalse(useCase.remind(appointment))
        verify(create, times(2)).createIfAbsent(dto)
    }

    private fun allowContext() {
        `when`(pets.findById(pet.id)).thenReturn(pet)
        `when`(services.findById(service.id)).thenReturn(service)
        `when`(vets.findById(veterinarian.id)).thenReturn(veterinarian)
        `when`(users.findById(user.id)).thenReturn(user)
    }

    private fun expected(recipient: UUID, actor: UUID?, type: NotificationType): CreateNotificationDto {
        val text = NotificationMessages.forAppointment(
            type,
            AppointmentNotificationDetails(pet.name, service.name, user.fullName, appointment.startAt, null),
            clinic.zoneId,
        )
        return CreateNotificationDto(recipient, actor, type, text.title, text.body, appointment.id, pet.id)
    }
}
