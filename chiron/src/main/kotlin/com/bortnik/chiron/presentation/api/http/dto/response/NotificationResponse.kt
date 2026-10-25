package com.bortnik.chiron.presentation.api.http.dto.response

import com.bortnik.chiron.domain.entities.enums.NotificationType
import java.time.Instant
import java.util.UUID

data class NotificationResponse(
    val id: UUID,
    val type: NotificationType,
    val title: String,
    val body: String,
    val actorId: UUID?,
    val appointmentId: UUID?,
    val petId: UUID?,
    val vaccinationId: UUID?,
    val readAt: Instant?,
    val createdAt: Instant,
)
