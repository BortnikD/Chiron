package com.bortnik.chiron.presentation.api.websocket

import com.bortnik.chiron.application.notification.NotificationChannel
import com.bortnik.chiron.domain.entities.Notification
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component

// Pushes a new notification to every open STOMP session of the recipient (each browser tab has its own);
// a recipient without an open session simply gets nothing here and reads the notification from the inbox.
// Clients subscribe to /user/queue/notifications.
@Component
class StompNotificationChannel(private val messagingTemplate: SimpMessagingTemplate) : NotificationChannel {

    override fun deliver(notification: Notification) =
        messagingTemplate.convertAndSendToUser(
            notification.recipientId.toString(),
            DESTINATION,
            notification.toResponse(),
        )

    private companion object {
        const val DESTINATION = "/queue/notifications"
    }
}
