package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.usecase.admin.vaccination.AdminDeleteVaccinationUseCase
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.vaccination
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.inOrder
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.entities.enums.UserRole
import java.util.UUID
import java.time.format.DateTimeFormatter
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class NotifyVaccinationUseCaseTest {
    private val pets = mock(PetRepository::class.java)
    private val notifications = mock(CreateNotificationUseCase::class.java)
    private val useCase = NotifyVaccinationUseCase(pets, notifications)
    private val actor = Actor(UUID.randomUUID(), UserRole.ADMIN, "Admin")
    private val fallback =
        CreateNotificationDto(pet.ownerId, type = NotificationType.VACCINATION_CREATED, title = "Title", body = "Body")

    @Test
    fun `creation edits and clearing due date notify the owner with current medical details`() {
        `when`(pets.findById(pet.id)).thenReturn(pet)
        useCase.notifyChange(actor.userId, null, vaccination)
        useCase.notifyChange(actor.userId, vaccination, vaccination.copy(name = "New vaccine"))
        useCase.notifyChange(actor.userId, vaccination, vaccination.copy(nextDueOn = null))

        val captor = ArgumentCaptor.forClass(CreateNotificationDto::class.java)
        verify(notifications, times(3)).create(captor.capture() ?: fallback)
        assertEquals(
            listOf(
                NotificationType.VACCINATION_CREATED,
                NotificationType.VACCINATION_UPDATED,
                NotificationType.VACCINATION_UPDATED
            ),
            captor.allValues.map { it.type },
        )
        assertTrue(captor.allValues.all { it.recipientId == pet.ownerId && it.actorId == actor.userId })
        assertTrue(captor.allValues.all { it.vaccinationId == vaccination.id && it.petId == pet.id })
        assertTrue(captor.allValues[1].body.contains("New vaccine"))
        assertFalse(captor.allValues[2].body.contains(vaccination.nextDueOn!!.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))))
    }

    @Test
    fun `unchanged vaccination does not load pet context or create a notification`() {
        useCase.notifyChange(actor.userId, vaccination, vaccination)
        verifyNoInteractions(pets, notifications)
    }

    @Test
    fun `deletion stores notification before removing the referenced vaccination`() {
        `when`(pets.findById(pet.id)).thenReturn(pet)
        val vaccinations = mock(VaccinationRepository::class.java)
        `when`(vaccinations.findById(vaccination.id)).thenReturn(vaccination)
        `when`(vaccinations.deleteById(vaccination.id)).thenReturn(true)

        AdminDeleteVaccinationUseCase(vaccinations, useCase).delete(actor, vaccination.id)

        val captor = ArgumentCaptor.forClass(CreateNotificationDto::class.java)
        val order = inOrder(vaccinations, notifications)
        order.verify(vaccinations).findById(vaccination.id)
        order.verify(notifications).create(captor.capture() ?: fallback)
        order.verify(vaccinations).deleteById(vaccination.id)
        assertEquals(NotificationType.VACCINATION_DELETED, captor.value.type)
        assertEquals(pet.ownerId, captor.value.recipientId)
    }
}
