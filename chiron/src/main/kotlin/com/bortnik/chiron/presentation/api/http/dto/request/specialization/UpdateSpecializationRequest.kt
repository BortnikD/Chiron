package com.bortnik.chiron.presentation.api.http.dto.request.specialization

import com.bortnik.chiron.domain.utils.ValidationConstants.COLOR_PATTERN
import com.bortnik.chiron.domain.utils.ValidationConstants.SpecializationRules
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.openapitools.jackson.nullable.JsonNullable

// Partial update: omitted fields keep their values; JsonNullable fields are cleared by an explicit null.
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
    @field:Pattern(regexp = COLOR_PATTERN, message = "must be a HEX color in #RRGGBB format")
    val color: JsonNullable<String?> = JsonNullable.undefined(),
)
