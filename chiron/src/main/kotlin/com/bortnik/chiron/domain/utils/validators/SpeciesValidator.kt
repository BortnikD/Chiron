package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.dto.species.CreateSpeciesDto
import com.bortnik.chiron.domain.dto.species.UpdateSpeciesDto
import com.bortnik.chiron.domain.utils.ValidationConstants.COLOR_REGEX
import com.bortnik.chiron.domain.utils.ValidationConstants.SpeciesRules

object SpeciesValidator {

    fun validate(dto: CreateSpeciesDto) = validateAll { species(dto.name, dto.color) }

    // Only the fields present in the partial update are checked.
    fun validate(dto: UpdateSpeciesDto) = validateAll { species(dto.name, dto.color.orElse(null)) }

    private fun ValidationErrorCollector.species(name: String?, color: String?) {
        ensureNotBlank("name", name)
        ensureMaxLength("name", name, SpeciesRules.NAME_MAX_LENGTH)
        ensureMatches("color", color, COLOR_REGEX, "must be a HEX color in #RRGGBB format")
    }
}
