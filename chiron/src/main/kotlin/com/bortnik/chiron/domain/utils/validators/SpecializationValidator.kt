package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.dto.specialization.CreateSpecializationDto
import com.bortnik.chiron.domain.dto.specialization.UpdateSpecializationDto
import com.bortnik.chiron.domain.utils.ValidationConstants.COLOR_REGEX
import com.bortnik.chiron.domain.utils.ValidationConstants.SpecializationRules

object SpecializationValidator {

    fun validate(dto: CreateSpecializationDto) = validateAll { specialization(dto.name, dto.description, dto.color) }

    // Only the fields present in the partial update are checked.
    fun validate(dto: UpdateSpecializationDto) = validateAll {
        specialization(dto.name, dto.description, dto.color.orElse(null))
    }

    private fun ValidationErrorCollector.specialization(name: String?, description: String?, color: String?) {
        ensureNotBlank("name", name)
        ensureMaxLength("name", name, SpecializationRules.NAME_MAX_LENGTH)
        ensureMaxLength("description", description, SpecializationRules.DESCRIPTION_MAX_LENGTH)
        ensureMatches("color", color, COLOR_REGEX, "must be a HEX color in #RRGGBB format")
    }
}
