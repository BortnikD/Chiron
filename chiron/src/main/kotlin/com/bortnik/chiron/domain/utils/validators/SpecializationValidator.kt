package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.specialization.CreateSpecializationDto
import com.bortnik.chiron.domain.dto.specialization.UpdateSpecializationDto
import com.bortnik.chiron.domain.utils.ValidationConstants.SpecializationRules

object SpecializationValidator {

    fun validate(dto: CreateSpecializationDto) = validateAll { specialization(dto.name, dto.description) }

    fun validate(dto: UpdateSpecializationDto) = validateAll { specialization(dto.name, dto.description) }

    private fun ValidationErrorCollector.specialization(name: String, description: String) {
        ensureNotBlank("name", name)
        ensureMaxLength("name", name, SpecializationRules.NAME_MAX_LENGTH)
        ensureMaxLength("description", description, SpecializationRules.DESCRIPTION_MAX_LENGTH)
    }
}
