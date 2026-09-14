package com.bortnik.chiron.domain.entities

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import java.time.Instant
import java.util.UUID

data class Appointment(
    val id: UUID,
    val veterinarianId: UUID,
    val petId: UUID,
    val serviceId: UUID,
    val followUpOf: UUID? = null,
    val startAt: Instant,
    val endAt: Instant,
    val status: AppointmentStatus,
    val priceSnapshot: Double,
    val clientComment: String? = null,
    val vetNotes: String? = null,
    val cancelledBy: UUID? = null,
    val cancelledAt: Instant? = null,
    val cancelReason: String? = null,
    val createdAt: Instant,
    val updatedAt: Instant,
)
