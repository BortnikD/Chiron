package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.application.notification.AppointmentNotificationDetails
import com.bortnik.chiron.application.notification.NotificationMessages
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.repositories.PetRepository
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
import org.mockito.Mockito.anyList
import org.mockito.Mockito.never
import org.mockito.Mockito.verifyNoMoreInteractions
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
    private val client = Actor(pet.ownerId, UserRole.CLIENT, "Client")
    private val veterinarianActor = Actor(user.id, UserRole.VETERINARIAN, "Veterinarian")
    private val pets = mock(PetRepository::class.java)
    private val vets = mock(VeterinarianRepository::class.java)
    private val users = mock(UserRepository::class.java)
    private val create = mock(CreateNotificationUseCase::class.java)
    private val clinic = ClinicProperties("Europe/Moscow", 15)
    private val useCase = NotifyAppointmentUseCase(pets, vets, users, create, clinic)
    private val fallback = CreateNotificationDto(pet.ownerId, type = notification.type, title = "Title", body = "Body")

    @Test
    fun `client booking addresses veterinarian user and includes appointment context`() {
        allowContext()
        `when`(create.create(any(CreateNotificationDto::class.java) ?: fallback)).thenReturn(notification)
        useCase.notifyChange(client, null, appointment.copy(status = AppointmentStatus.PENDING))
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
        useCase.notifyChange(
            Actor(actorId, UserRole.ADMIN, "Admin"),
            appointment.copy(veterinarianId = previous.id),
            appointment
        )
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
        useCase.notifyChange(client, appointment, appointment)
        verifyNoInteractions(create)
    }

    @Test
    fun `reminder addresses owner without an actor and reports duplicate suppression`() {
        allowContext()
        val dto = expected(pet.ownerId, null, NotificationType.APPOINTMENT_REMINDER)
            .copy(reminderStartAt = appointment.startAt)
        `when`(create.createIfAbsent(dto)).thenReturn(notification, null)
        assertTrue(useCase.remind(appointment))
        assertFalse(useCase.remind(appointment))
        verify(create, times(2)).createIfAbsent(dto)
    }

    @Test
    fun `rescheduled appointment carries a new reminder key without changing its identity`() {
        allowContext()
        `when`(create.createIfAbsent(any(CreateNotificationDto::class.java) ?: fallback)).thenReturn(notification)
        val moved = appointment.copy(
            startAt = appointment.startAt.plusSeconds(86400),
            endAt = appointment.endAt.plusSeconds(86400),
        )
        assertTrue(useCase.remind(appointment))
        assertTrue(useCase.remind(moved))
        val captor = ArgumentCaptor.forClass(CreateNotificationDto::class.java)
        verify(create, times(2)).createIfAbsent(captor.capture() ?: fallback)
        assertEquals(listOf(appointment.startAt, moved.startAt), captor.allValues.map { it.reminderStartAt })
        assertEquals(setOf(appointment.id), captor.allValues.map { it.appointmentId }.toSet())
    }

    @Test
    fun `completion and changed notes create separate stored notifications for the owner`() {
        allowContext()
        `when`(create.create(any(CreateNotificationDto::class.java) ?: fallback)).thenReturn(notification)
        useCase.notifyChange(
            veterinarianActor,
            appointment,
            appointment.copy(status = AppointmentStatus.COMPLETED, vetNotes = "New notes"),
        )
        val captor = ArgumentCaptor.forClass(CreateNotificationDto::class.java)
        verify(create, times(2)).create(captor.capture() ?: fallback)
        assertEquals(
            setOf(NotificationType.APPOINTMENT_COMPLETED, NotificationType.APPOINTMENT_NOTES_UPDATED),
            captor.allValues.map { it.type }.toSet(),
        )
        assertTrue(captor.allValues.all { it.recipientId == pet.ownerId && it.actorId == user.id })
    }

    @Test
    fun `completed appointment correction notifies owner using snapshot names and actual amount`() {
        allowContext()
        `when`(create.create(any(CreateNotificationDto::class.java) ?: fallback)).thenReturn(notification)
        val before = appointment.copy(
            status = AppointmentStatus.COMPLETED,
            services = appointment.services.map { it.copy(nameSnapshot = "Original examination", isPerformed = true) })
        val after = before.copy(
            services = before.services + before.services.single().copy(
                serviceId = UUID.randomUUID(), nameSnapshot = "Vaccination", priceSnapshot = 50.0,
                isPlanned = false, isPerformed = true,
            )
        )

        useCase.notifyChange(veterinarianActor, before, after)

        val captor = ArgumentCaptor.forClass(CreateNotificationDto::class.java)
        verify(create).create(captor.capture() ?: fallback)
        assertEquals(NotificationType.APPOINTMENT_SERVICES_UPDATED, captor.value.type)
        assertEquals(pet.ownerId, captor.value.recipientId)
        assertTrue(captor.value.body.contains("Original examination, Vaccination"))
        assertTrue(captor.value.body.contains("150.00"))
    }

    @Test
    fun `completion confirms services in a single completion notification with the actual amount`() {
        allowContext()
        `when`(create.create(any(CreateNotificationDto::class.java) ?: fallback)).thenReturn(notification)
        val after = appointment.copy(
            status = AppointmentStatus.COMPLETED,
            services = appointment.services.map { it.copy(isPerformed = true) })

        useCase.notifyChange(veterinarianActor, appointment, after)

        val captor = ArgumentCaptor.forClass(CreateNotificationDto::class.java)
        verify(create).create(captor.capture() ?: fallback)
        assertEquals(NotificationType.APPOINTMENT_COMPLETED, captor.value.type)
        assertTrue(captor.value.body.contains("100.00"))
    }

    @Test
    fun `schedule conflict is stored for all administrators including the actor`() {
        allowContext()
        val actorId = UUID.randomUUID()
        val otherAdminId = UUID.randomUUID()
        `when`(create.create(any(CreateNotificationDto::class.java) ?: fallback)).thenReturn(notification)
        useCase.notifyScheduleConflict(actorId, appointment, setOf(actorId, otherAdminId))
        val captor = ArgumentCaptor.forClass(CreateNotificationDto::class.java)
        verify(create, times(2)).create(captor.capture() ?: fallback)
        assertEquals(setOf(actorId, otherAdminId), captor.allValues.map { it.recipientId }.toSet())
        assertTrue(captor.allValues.all { it.type == NotificationType.SCHEDULE_CONFLICT && it.appointmentId == appointment.id })
    }

    @Test
    fun `client booking and cancellation notify every administrator with one batch per event`() {
        allowContext()
        val administratorIds = (1..100).map { UUID.randomUUID() }
        `when`(users.findAdministratorIds()).thenReturn(administratorIds)
        `when`(create.create(any(CreateNotificationDto::class.java) ?: fallback)).thenReturn(notification)
        `when`(create.createAll(anyList())).thenReturn(emptyList())
        useCase.notifyChange(client, null, appointment.copy(status = AppointmentStatus.PENDING))
        useCase.notifyChange(client, appointment, appointment.copy(status = AppointmentStatus.CANCELLED))

        @Suppress("UNCHECKED_CAST")
        val captor = ArgumentCaptor.forClass(List::class.java) as ArgumentCaptor<List<CreateNotificationDto>>
        verify(create, times(2)).createAll(captor.capture() ?: emptyList())
        assertEquals(
            listOf(NotificationType.APPOINTMENT_BOOKED, NotificationType.APPOINTMENT_CANCELLED),
            captor.allValues.map { batch -> batch.map { it.type }.distinct().single() })
        assertTrue(captor.allValues.all { batch -> batch.map { it.recipientId } == administratorIds })
        verify(users, times(2)).findAdministratorIds()
        verify(users, times(2)).findById(user.id)
        verifyNoMoreInteractions(users)
    }

    @Test
    fun `repeated cancellation and changes made by staff do not produce client alerts to administrators`() {
        allowContext()
        val cancelled = appointment.copy(status = AppointmentStatus.CANCELLED)
        useCase.notifyChange(client, cancelled, cancelled)
        useCase.notifyChange(veterinarianActor, appointment, cancelled)
        useCase.notifyChange(client.copy(role = UserRole.ADMIN), appointment, cancelled)
        useCase.notifyChange(client.copy(role = UserRole.VETERINARIAN), null, appointment)
        verify(users, never()).findAdministratorIds()
        verify(create, never()).createAll(anyList())
    }

    private fun allowContext() {
        `when`(pets.findById(pet.id)).thenReturn(pet)
        `when`(vets.findById(veterinarian.id)).thenReturn(veterinarian)
        `when`(users.findById(user.id)).thenReturn(user)
    }

    private fun expected(recipient: UUID, actor: UUID?, type: NotificationType): CreateNotificationDto {
        val text = NotificationMessages.forAppointment(
            type,
            AppointmentNotificationDetails(
                pet.name, service.name, user.fullName, appointment.startAt, null, appointment.status,
            ),
            clinic.zoneId,
        )
        return CreateNotificationDto(recipient, actor, type, text.title, text.body, appointment.id, pet.id)
    }
}
