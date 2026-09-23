package com.bortnik.chiron.presentation.api.http.dto.request.specialization

import com.bortnik.chiron.domain.utils.ValidationConstants.SpecializationRules
import jakarta.validation.constraints.Size

// Partial update: omitted fields keep their values.
data class UpdateSpecializationRequest(
    @field:Size(
        max = SpecializationRules.NAME_MAX_LENGTH,
        message = "must be at most ${SpecializationRules.NAME_MAX_LENGTH} characters",
    )
    val name: String? = null,
    @field:Size(
        max = SpecializationRules.DESCRIPTION_MAX_LENGTH,
        message = "must be at most ${SpecializationRules.DESCRIPTION_MAX_LENGTH} characters",
    )
    val description: String? = null,
)
