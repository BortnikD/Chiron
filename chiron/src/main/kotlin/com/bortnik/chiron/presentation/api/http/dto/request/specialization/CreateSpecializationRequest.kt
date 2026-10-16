package com.bortnik.chiron.presentation.api.http.dto.request.specialization

import com.bortnik.chiron.domain.utils.ValidationConstants.SpecializationRules
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateSpecializationRequest(
    @field:NotBlank(message = "must not be blank")
    @field:Size(
        max = SpecializationRules.NAME_MAX_LENGTH,
        message = "must be at most ${SpecializationRules.NAME_MAX_LENGTH} characters",
    )
    val name: String,
    @field:Size(
        max = SpecializationRules.DESCRIPTION_MAX_LENGTH,
        message = "must be at most ${SpecializationRules.DESCRIPTION_MAX_LENGTH} characters",
    )
    val description: String,
)
