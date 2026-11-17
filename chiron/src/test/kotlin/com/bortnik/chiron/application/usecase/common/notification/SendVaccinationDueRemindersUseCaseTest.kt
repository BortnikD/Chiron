package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.config.NotificationProperties
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.dto.vaccination.VaccinationReminderDto
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.support.TestEntities.notification
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.vaccination
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.anyList
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SendVaccinationDueRemindersUseCaseTest {
    @Suppress("UNCHECKED_CAST")
    private val batchCaptor = ArgumentCaptor.forClass(List::class.java) as ArgumentCaptor<List<CreateNotificationDto>>
    private val vaccinations = mock(VaccinationRepository::class.java)
    private val create = mock(CreateNotificationUseCase::class.java)
    private val clinic = ClinicProperties("Europe/Moscow", 15)
    private val clock = Clock.fixed(Instant.parse("2026-11-07T21:30:00Z"), ZoneOffset.UTC)
    private val today = LocalDate.of(2026, 11, 8)
    private val config = NotificationProperties(
        NotificationProperties.Reminder(Duration.ofHours(24)), NotificationProperties.VaccinationDue(7),
    )
    private val useCase = SendVaccinationDueRemindersUseCase(vaccinations, create, config, clinic, clock)

    @Test
    fun `clinic day includes today and the last lead day while previous dates are overdue`() {
        val dueDates = listOf(today.minusDays(30), today.minusDays(1), today, today.plusDays(7))
        val candidates = dueDates.map { date ->
            VaccinationReminderDto(vaccination.copy(id = UUID.randomUUID(), nextDueOn = date), pet.ownerId, pet.name)
        }
        `when`(vaccinations.findReminders(today, today.plusDays(7))).thenReturn(candidates)
        `when`(create.createAllIfAbsent(anyList())).thenReturn(candidates.map { notification })

        assertEquals(4, useCase.send())

        val captor = batchCaptor
        verify(create).createAllIfAbsent(captor.capture() ?: emptyList())
        val dtos = captor.value
        assertEquals(
            listOf(
                NotificationType.VACCINATION_OVERDUE, NotificationType.VACCINATION_OVERDUE,
                NotificationType.VACCINATION_DUE, NotificationType.VACCINATION_DUE
            ),
            dtos.map { it.type },
        )
        assertEquals(dueDates, dtos.map { it.reminderDueOn })
        assertTrue(dtos.all { it.recipientId == pet.ownerId && it.actorId == null })
        verify(vaccinations).findReminders(today, today.plusDays(7))
        verifyNoMoreInteractions(vaccinations)
    }

    @Test
    fun `many reminders use one candidate query and one batch without per vaccination lookups`() {
        val candidates = (1..100).map {
            VaccinationReminderDto(vaccination.copy(id = UUID.randomUUID()), UUID.randomUUID(), "Pet $it")
        }
        `when`(vaccinations.findReminders(today, today.plusDays(7))).thenReturn(candidates)
        `when`(create.createAllIfAbsent(anyList())).thenReturn(listOf(notification))
        assertEquals(1, useCase.send())
        verify(vaccinations).findReminders(today, today.plusDays(7))
        verify(create).createAllIfAbsent(anyList())
        verifyNoMoreInteractions(vaccinations, create)
    }

    @Test
    fun `concurrent duplicate suppression counts only notifications actually inserted`() {
        `when`(vaccinations.findReminders(today, today.plusDays(7))).thenReturn(
            listOf(VaccinationReminderDto(vaccination, pet.ownerId, pet.name)),
        )
        `when`(create.createAllIfAbsent(anyList())).thenReturn(listOf(notification), emptyList())
        assertEquals(1, useCase.send())
        assertEquals(0, useCase.send())
        verify(create, times(2)).createAllIfAbsent(anyList())
    }

    @Test
    fun `changed due dates retain separate reminder identities`() {
        `when`(vaccinations.findReminders(today, today.plusDays(7))).thenReturn(
            listOf(VaccinationReminderDto(vaccination, pet.ownerId, pet.name)),
            listOf(VaccinationReminderDto(vaccination.copy(nextDueOn = today.plusDays(1)), pet.ownerId, pet.name)),
        )
        `when`(create.createAllIfAbsent(anyList())).thenReturn(listOf(notification))
        useCase.send()
        useCase.send()
        val captor = batchCaptor
        verify(create, times(2)).createAllIfAbsent(captor.capture() ?: emptyList())
        assertEquals(
            listOf(today, today.plusDays(1)),
            captor.allValues.flatMap { batch -> batch.map { it.reminderDueOn } })
    }
}
