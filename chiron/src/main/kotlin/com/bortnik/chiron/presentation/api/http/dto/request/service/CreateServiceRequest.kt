package com.bortnik.chiron.presentation.api.http.dto.request.service

import java.util.UUID

data class CreateServiceRequest(
    val specializationId: UUID,
    val name: String,
    val description: String,
    val basePrice: Double,
    val baseDurationMin: Int,
    val bufferAfterMin: Int = 0,
    val isActive: Boolean = true,
)
