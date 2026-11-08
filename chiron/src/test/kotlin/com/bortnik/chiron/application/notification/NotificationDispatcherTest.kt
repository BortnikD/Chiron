package com.bortnik.chiron.application.notification

import com.bortnik.chiron.support.TestEntities.notification
import org.junit.jupiter.api.Test
import org.mockito.Mockito.doThrow
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoMoreInteractions

class NotificationDispatcherTest {
    @Test
    fun `failed delivery does not prevent subsequent channels from receiving the same notification`() {
        val first = mock(NotificationChannel::class.java)
        val failing = mock(NotificationChannel::class.java)
        val last = mock(NotificationChannel::class.java)
        doThrow(IllegalStateException("Unavailable channel")).`when`(failing).deliver(notification)
        NotificationDispatcher(listOf(first, failing, last)).dispatch(NotificationCreatedEvent(notification))
        for (channel in listOf(first, failing, last)) {
            verify(channel).deliver(notification)
            verifyNoMoreInteractions(channel)
        }
    }
}
