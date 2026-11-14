package com.bortnik.chiron.domain.dto.specialization

data class CreateSpecializationDto(
    val name: String,
    val description: String,
    val color: String? = null,
)
