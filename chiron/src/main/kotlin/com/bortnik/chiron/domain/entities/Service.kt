package com.bortnik.chiron.domain.entities

import java.time.Instant
import java.util.UUID

data class Service(
    val id: UUID,
    val specializationId: UUID,
    val name: String,
    val description: String,
    val basePrice: Double,
    val baseDurationMin: Int,
    val bufferAfterMin: Int = 0,
    val isActive: Boolean = true,
    val createdAt: Instant,
    val updatedAt: Instant,
)
