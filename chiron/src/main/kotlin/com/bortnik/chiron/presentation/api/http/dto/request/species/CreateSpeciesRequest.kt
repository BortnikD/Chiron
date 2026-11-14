package com.bortnik.chiron.presentation.api.http.dto.request.species

import com.bortnik.chiron.domain.utils.ValidationConstants.COLOR_PATTERN
import com.bortnik.chiron.domain.utils.ValidationConstants.SpeciesRules
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class CreateSpeciesRequest(
    @field:NotBlank(message = "must not be blank")
    @field:Size(
        max = SpeciesRules.NAME_MAX_LENGTH,
        message = "must be at most ${SpeciesRules.NAME_MAX_LENGTH} characters",
    )
    val name: String,
    @field:Pattern(regexp = COLOR_PATTERN, message = "must be a HEX color in #RRGGBB format")
    val color: String? = null,
    val iconKey: String? = null,
)
