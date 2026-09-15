package com.bortnik.chiron.presentation.api.http.dto.response

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import java.time.Instant
import java.util.UUID

data class AppointmentResponse(
    val id: UUID,
    val veterinarianId: UUID,
    val petId: UUID,
    val serviceId: UUID,
    val followUpOf: UUID?,
    val startAt: Instant,
    val endAt: Instant,
    val status: AppointmentStatus,
    val priceSnapshot: Double,
    val clientComment: String?,
    val vetNotes: String?,
    val cancelledBy: UUID?,
    val cancelledAt: Instant?,
    val cancelReason: String?,
    val createdAt: Instant,
    val updatedAt: Instant,
)
