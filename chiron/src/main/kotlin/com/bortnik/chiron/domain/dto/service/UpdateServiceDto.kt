package com.bortnik.chiron.domain.dto.service

import java.util.UUID

// Partial update: null keeps the stored value.
data class UpdateServiceDto(
    val specializationId: UUID? = null,
    val name: String? = null,
    val description: String? = null,
    val basePrice: Double? = null,
    val baseDurationMin: Int? = null,
    val bufferAfterMin: Int? = null,
    val isActive: Boolean? = null,
)
