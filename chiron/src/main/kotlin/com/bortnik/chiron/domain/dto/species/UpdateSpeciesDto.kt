package com.bortnik.chiron.domain.dto.species

// Partial update: null keeps the stored value.
data class UpdateSpeciesDto(
    val name: String? = null,
)
