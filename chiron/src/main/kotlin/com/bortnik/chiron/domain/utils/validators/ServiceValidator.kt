package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.service.CreateServiceDto
import com.bortnik.chiron.domain.dto.service.UpdateServiceDto
import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MAX
import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MIN
import com.bortnik.chiron.domain.utils.ValidationConstants.ServiceRules

object ServiceValidator {

    fun validate(dto: CreateServiceDto) = validateAll {
        service(dto.name, dto.description, dto.basePrice, dto.baseDurationMin, dto.bufferAfterMin)
    }

    // Only the fields present in the partial update are checked.
    fun validate(dto: UpdateServiceDto) = validateAll {
        service(dto.name, dto.description, dto.basePrice, dto.baseDurationMin, dto.bufferAfterMin)
    }

    private fun ValidationErrorCollector.service(
        name: String?,
        description: String?,
        basePrice: Double?,
        baseDurationMin: Int?,
        bufferAfterMin: Int?,
    ) {
        ensureNotBlank("name", name)
        ensureMaxLength("name", name, ServiceRules.NAME_MAX_LENGTH)
        ensureMaxLength("description", description, ServiceRules.DESCRIPTION_MAX_LENGTH)
        ensureInRange("basePrice", basePrice, MONEY_MIN, MONEY_MAX)
        ensureInRange("baseDurationMin", baseDurationMin, ServiceRules.DURATION_MIN_MINUTES, ServiceRules.DURATION_MAX_MINUTES)
        ensureInRange("bufferAfterMin", bufferAfterMin, ServiceRules.BUFFER_MIN_MINUTES, ServiceRules.BUFFER_MAX_MINUTES)
    }
}
