package com.bortnik.chiron.domain.dto.species

data class CreateSpeciesDto(
    val name: String,
    val color: String? = null,
    val iconKey: String? = null,
)
