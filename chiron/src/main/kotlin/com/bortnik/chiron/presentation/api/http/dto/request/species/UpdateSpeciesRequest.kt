package com.bortnik.chiron.presentation.api.http.dto.request.species

import com.bortnik.chiron.domain.utils.ValidationConstants.COLOR_PATTERN
import com.bortnik.chiron.domain.utils.ValidationConstants.SpeciesRules
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.openapitools.jackson.nullable.JsonNullable

// Partial update: omitted fields keep their values; JsonNullable fields are cleared by an explicit null.
data class UpdateSpeciesRequest(
    @field:Size(
        max = SpeciesRules.NAME_MAX_LENGTH,
        message = "must be at most ${SpeciesRules.NAME_MAX_LENGTH} characters",
    )
    val name: String? = null,
    @field:Pattern(regexp = COLOR_PATTERN, message = "must be a HEX color in #RRGGBB format")
    val color: JsonNullable<String?> = JsonNullable.undefined(),
    val iconKey: JsonNullable<String?> = JsonNullable.undefined(),
)
