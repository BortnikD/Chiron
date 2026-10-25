package com.bortnik.chiron.application.notification

import com.bortnik.chiron.domain.entities.Notification

// A way to deliver a stored notification to its recipient (WebSocket now; e-mail, messengers, push later).
// Every Spring bean implementing it receives every created notification after the transaction commits;
// the notification inbox is the source of truth, so a channel may skip recipients it cannot reach.
interface NotificationChannel {
    fun deliver(notification: Notification)
}
