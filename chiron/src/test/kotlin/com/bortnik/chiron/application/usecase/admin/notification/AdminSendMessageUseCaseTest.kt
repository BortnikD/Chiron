package com.bortnik.chiron.application.usecase.admin.notification

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.notification.CreateNotificationUseCase
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.dto.notification.SendAdminMessageDto
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VaccinationNotFoundException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.notification
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.user
import com.bortnik.chiron.support.TestEntities.vaccination
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import java.util.UUID
import kotlin.test.assertFailsWith
import kotlin.test.assertSame

class AdminSendMessageUseCaseTest {
    private val users = mock(UserRepository::class.java)
    private val appointments = mock(AppointmentRepository::class.java)
    private val pets = mock(PetRepository::class.java)
    private val vaccinations = mock(VaccinationRepository::class.java)
    private val notifications = mock(CreateNotificationUseCase::class.java)
    private val useCase = AdminSendMessageUseCase(users, appointments, pets, vaccinations, notifications)
    private val admin = Actor(UUID(0, 100), UserRole.ADMIN, "Admin")
    private val message = SendAdminMessageDto("Title", "Body")

    @Test
    fun `single message keeps custom text and records admin as author without event links`() {
        val saved = stored()
        `when`(users.findById(user.id)).thenReturn(user)
        `when`(notifications.create(expected(user.id))).thenReturn(saved)

        assertSame(saved, useCase.send(admin, user.id, message))

        verify(notifications).create(expected(user.id))
        verify(users).findById(user.id)
        verifyNoMoreInteractions(users, notifications)
        verifyNoInteractions(appointments, pets, vaccinations)
    }

    @Test
    fun `non admins cannot send personal messages`() {
        for (role in listOf(UserRole.CLIENT, UserRole.VETERINARIAN)) {
            assertFailsWith<AccessDeniedException> { useCase.send(admin.copy(role = role), user.id, message) }
        }
        verifyNoInteractions(users, appointments, pets, vaccinations, notifications)
    }

    @Test
    fun `blank and oversized messages are rejected before looking up recipient`() {
        for (invalid in listOf(
            message.copy(title = " "),
            message.copy(body = "\n"),
            message.copy(title = "x".repeat(201)),
            message.copy(body = "x".repeat(4001)),
        )) {
            assertFailsWith<ValidationException> { useCase.send(admin, user.id, invalid) }
        }
        verifyNoInteractions(users, appointments, pets, vaccinations, notifications)
    }

    @Test
    fun `maximum length message is accepted`() {
        val longest = message.copy(title = "x".repeat(200), body = "x".repeat(4000))
        val saved = stored(longest)
        `when`(users.findById(user.id)).thenReturn(user)
        `when`(notifications.create(expected(user.id, longest))).thenReturn(saved)
        assertSame(saved, useCase.send(admin, user.id, longest))
        verify(notifications).create(expected(user.id, longest))
    }

    @Test
    fun `missing recipient prevents notification creation`() {
        assertFailsWith<UserNotFoundException> { useCase.send(admin, user.id, message) }
        verify(users).findById(user.id)
        verifyNoMoreInteractions(users)
        verifyNoInteractions(notifications)
    }

    @Test
    fun `event links are optional individually and preserved together`() {
        `when`(users.findById(user.id)).thenReturn(user)
        `when`(appointments.findById(appointment.id)).thenReturn(appointment)
        `when`(pets.findById(pet.id)).thenReturn(pet)
        `when`(vaccinations.findById(vaccination.id)).thenReturn(vaccination)
        for (linked in listOf(
            message.copy(appointmentId = appointment.id),
            message.copy(petId = pet.id),
            message.copy(vaccinationId = vaccination.id),
            message.copy(appointmentId = appointment.id, petId = pet.id, vaccinationId = vaccination.id),
        )) {
            val saved = stored(linked)
            `when`(notifications.create(expected(user.id, linked))).thenReturn(saved)
            assertSame(saved, useCase.send(admin, user.id, linked))
            verify(notifications).create(expected(user.id, linked))
        }
    }

    @Test
    fun `missing event links fail before recipient or notification is loaded`() {
        assertFailsWith<AppointmentNotFoundException> {
            useCase.send(admin, user.id, message.copy(appointmentId = appointment.id))
        }
        assertFailsWith<PetNotFoundException> {
            useCase.send(admin, user.id, message.copy(petId = pet.id))
        }
        assertFailsWith<VaccinationNotFoundException> {
            useCase.send(admin, user.id, message.copy(vaccinationId = vaccination.id))
        }
        verifyNoInteractions(users, notifications)
    }

    @Test
    fun `event links pointing to different pets are rejected`() {
        `when`(appointments.findById(appointment.id)).thenReturn(appointment)
        `when`(pets.findById(pet.id)).thenReturn(pet)
        `when`(vaccinations.findById(vaccination.id)).thenReturn(vaccination.copy(petId = UUID(0, 200)))
        for (linked in listOf(
            message.copy(appointmentId = appointment.id, vaccinationId = vaccination.id),
            message.copy(petId = pet.id, vaccinationId = vaccination.id),
        )) {
            assertFailsWith<BusinessRuleViolationException> { useCase.send(admin, user.id, linked) }
        }
        verifyNoInteractions(users, notifications)
    }

    private fun stored(dto: SendAdminMessageDto = message) = notification.copy(
        recipientId = user.id,
        actorId = admin.userId,
        type = NotificationType.ADMIN_MESSAGE,
        title = dto.title,
        body = dto.body,
        appointmentId = dto.appointmentId,
        petId = dto.petId,
        vaccinationId = dto.vaccinationId,
    )

    private fun expected(recipientId: UUID, dto: SendAdminMessageDto = message) = CreateNotificationDto(
        recipientId = recipientId,
        actorId = admin.userId,
        type = NotificationType.ADMIN_MESSAGE,
        title = dto.title,
        body = dto.body,
        appointmentId = dto.appointmentId,
        petId = dto.petId,
        vaccinationId = dto.vaccinationId,
    )
}
