package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.servicespecies.UpdateServiceSpeciesDto
import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MAX
import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MIN
import com.bortnik.chiron.domain.utils.ValidationConstants.ServiceRules

object ServiceSpeciesValidator {

    fun validate(serviceSpecies: ServiceSpecies) = validateAll { overrides(serviceSpecies.durationMin, serviceSpecies.price) }

    fun validate(dto: UpdateServiceSpeciesDto) = validateAll { overrides(dto.durationMin, dto.price) }

    private fun ValidationErrorCollector.overrides(durationMin: Int?, price: Double?) {
        ensureInRange("durationMin", durationMin, ServiceRules.DURATION_MIN_MINUTES, ServiceRules.DURATION_MAX_MINUTES)
        ensureInRange("price", price, MONEY_MIN, MONEY_MAX)
    }
}
