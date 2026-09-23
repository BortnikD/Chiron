package com.bortnik.chiron.presentation.api.http.dto.request.species

import com.bortnik.chiron.domain.utils.ValidationConstants.SpeciesRules
import jakarta.validation.constraints.Size

// Partial update: omitted fields keep their values.
data class UpdateSpeciesRequest(
    @field:Size(
        max = SpeciesRules.NAME_MAX_LENGTH,
        message = "must be at most ${SpeciesRules.NAME_MAX_LENGTH} characters",
    )
    val name: String? = null,
)
