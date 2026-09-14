package com.bortnik.chiron.domain.dto.service

import java.util.UUID

data class CreateServiceDto(
    val specializationId: UUID,
    val name: String,
    val description: String,
    val basePrice: Double,
    val baseDurationMin: Int,
    val bufferAfterMin: Int = 0,
    val isActive: Boolean = true,
)
