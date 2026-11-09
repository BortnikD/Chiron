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
    fun `duplicate reminder neither creates a new event nor reports a sent notification`() {
        `when`(repository.createIfAbsent(dto)).thenReturn(notification, null)
        assertEquals(notification, useCase.createIfAbsent(dto))
        assertNull(useCase.createIfAbsent(dto))
        verify(repository, times(2)).createIfAbsent(dto)
        verify(publisher).publishEvent(NotificationCreatedEvent(notification))
        verifyNoMoreInteractions(repository, publisher)
    }
}
