package com.bortnik.chiron.domain.dto.specialization

// Partial update: null keeps the stored value.
data class UpdateSpecializationDto(
    val name: String? = null,
    val description: String? = null,
)
