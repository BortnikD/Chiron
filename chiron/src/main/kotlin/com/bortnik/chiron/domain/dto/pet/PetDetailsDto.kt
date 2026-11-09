package com.bortnik.chiron.domain.dto.pet

import com.bortnik.chiron.domain.entities.Pet

data class PetDetailsDto(
    val pet: Pet,
    val summary: PetSummaryDto? = null,
)
