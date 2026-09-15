package com.bortnik.chiron.presentation.api.http.dto.response

import java.time.Instant
import java.util.UUID

data class ServiceResponse(
    val id: UUID,
    val specializationId: UUID,
    val name: String,
    val description: String,
    val basePrice: Double,
    val baseDurationMin: Int,
    val bufferAfterMin: Int,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant,
)
