package com.bortnik.chiron.domain.entities

import java.time.Instant
import java.util.UUID

data class AppointmentService(
    val serviceId: UUID,
    val nameSnapshot: String,
    val priceSnapshot: Double,
    val durationMinSnapshot: Int?,
    val bufferAfterMinSnapshot: Int?,
    val isPlanned: Boolean = true,
    val isPerformed: Boolean? = null,
    val addedBy: UUID? = null,
    val createdAt: Instant = Instant.now(),
    val updatedBy: UUID? = null,
    val updatedAt: Instant = createdAt,
)
