package com.bortnik.chiron.application.notification

import com.bortnik.chiron.domain.entities.Notification

data class NotificationCreatedEvent(
    val notification: Notification,
)
