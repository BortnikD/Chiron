package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.species.CreateSpeciesDto
import com.bortnik.chiron.domain.dto.species.UpdateSpeciesDto
import com.bortnik.chiron.domain.utils.ValidationConstants.SpeciesRules

object SpeciesValidator {

    fun validate(dto: CreateSpeciesDto) = validateAll { name(dto.name) }

    // Only the fields present in the partial update are checked.
    fun validate(dto: UpdateSpeciesDto) = validateAll { name(dto.name) }

    private fun ValidationErrorCollector.name(name: String?) {
        ensureNotBlank("name", name)
        ensureMaxLength("name", name, SpeciesRules.NAME_MAX_LENGTH)
    }
}
