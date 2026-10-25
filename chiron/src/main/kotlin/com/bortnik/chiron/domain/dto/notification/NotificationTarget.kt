package com.bortnik.chiron.domain.dto.notification

import com.bortnik.chiron.domain.entities.enums.NotificationType
import java.util.UUID

// One notification of the given type for each of the users.
data class NotificationTarget(
    val type: NotificationType,
    val recipientIds: Set<UUID>,
)
