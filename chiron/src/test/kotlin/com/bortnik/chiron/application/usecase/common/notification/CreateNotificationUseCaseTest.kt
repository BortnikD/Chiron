package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.notification.NotificationCreatedEvent
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.repositories.NotificationRepository
import com.bortnik.chiron.support.TestEntities.notification
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import org.springframework.context.ApplicationEventPublisher
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class CreateNotificationUseCaseTest {
    private val repository = mock(NotificationRepository::class.java)
    private val publisher = mock(ApplicationEventPublisher::class.java)
    private val useCase = CreateNotificationUseCase(repository, publisher)
    private val dto =
        CreateNotificationDto(notification.recipientId, type = notification.type, title = "Title", body = "Body")

    @Test
    fun `new notification publishes the stored entity`() {
        `when`(repository.create(dto)).thenReturn(notification)
        assertEquals(notification, useCase.create(dto))
        verify(publisher).publishEvent(NotificationCreatedEvent(notification))
    }

    @Test
    fun `batch writes once and publishes every inserted notification`() {
        val other = notification.copy(id = java.util.UUID.randomUUID())
        val batch = listOf(dto, dto.copy(recipientId = java.util.UUID.randomUUID()))
        `when`(repository.createAll(batch)).thenReturn(listOf(notification, other))
        assertEquals(listOf(notification, other), useCase.createAll(batch))
        verify(repository).createAll(batch)
        verifyNoMoreInteractions(repository)
        verify(publisher).publishEvent(NotificationCreatedEvent(notification))
        verify(publisher).publishEvent(NotificationCreatedEvent(other))
    }

    @Test
    fun `batch duplicate suppression publishes only actually inserted rows`() {
        val batch = listOf(dto, dto)
        `when`(repository.createAllIfAbsent(batch)).thenReturn(listOf(notification))
        assertEquals(listOf(notification), useCase.createAllIfAbsent(batch))
        verify(repository).createAllIfAbsent(batch)
        verify(publisher).publishEvent(NotificationCreatedEvent(notification))
        verifyNoMoreInteractions(publisher, repository)
    }

    @Test
    fun `empty batches issue no database requests or events`() {
        assertTrue(useCase.createAll(emptyList()).isEmpty())
        assertTrue(useCase.createAllIfAbsent(emptyList()).isEmpty())
        verifyNoMoreInteractions(repository, publisher)
    }

    @Test
    fun `duplicate reminder neither creates a new event nor reports a sent notification`() {
        `when`(repository.createIfAbsent(dto)).thenReturn(notification, null)
        assertEquals(notification, useCase.createIfAbsent(dto))
        assertNull(useCase.createIfAbsent(dto))
        verify(repository, times(2)).createIfAbsent(dto)
        verify(publisher).publishEvent(NotificationCreatedEvent(notification))
        verifyNoMoreInteractions(repository, publisher)
    }
}
