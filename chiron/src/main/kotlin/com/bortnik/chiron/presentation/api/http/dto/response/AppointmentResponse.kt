package com.bortnik.chiron.presentation.api.http.dto.response

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import java.time.Instant
import java.util.UUID

data class AppointmentResponse(
    val id: UUID,
    val veterinarianId: UUID,
    val petId: UUID,
    val services: List<AppointmentServiceResponse>,
    val followUpOf: UUID?,
    val startAt: Instant,
    val endAt: Instant,
    val status: AppointmentStatus,
    val estimatedTotal: Double,
    val actualTotal: Double?,
    val durationMin: Int?,
    val bufferAfterMin: Int?,
    val clientComment: String?,
    val vetNotes: String?,
    val cancelledBy: UUID?,
    val cancelledAt: Instant?,
    val cancelReason: String?,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class AppointmentServiceResponse(
    val serviceId: UUID,
    val nameSnapshot: String,
    val priceSnapshot: Double,
    val durationMinSnapshot: Int?,
    val bufferAfterMinSnapshot: Int?,
    val isPlanned: Boolean,
    val isPerformed: Boolean?,
    val addedBy: UUID?,
    val createdAt: Instant,
    val updatedBy: UUID?,
    val updatedAt: Instant,
)
