package com.bortnik.chiron.domain.entities

import com.bortnik.chiron.domain.entities.enums.NotificationType
import java.time.Instant
import java.util.UUID

// title / body are rendered when the event happens; actorId is null for notifications created by the scheduler.
data class Notification(
    val id: UUID,
    val recipientId: UUID,
    val actorId: UUID? = null,
    val type: NotificationType,
    val title: String,
    val body: String,
    val appointmentId: UUID? = null,
    val petId: UUID? = null,
    val vaccinationId: UUID? = null,
    val readAt: Instant? = null,
    val createdAt: Instant,
)
