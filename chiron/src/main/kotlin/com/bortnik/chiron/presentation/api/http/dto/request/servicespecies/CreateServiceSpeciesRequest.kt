package com.bortnik.chiron.presentation.api.http.dto.request.servicespecies

import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MAX
import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MIN
import com.bortnik.chiron.domain.utils.ValidationConstants.ServiceRules
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import java.util.UUID

data class CreateServiceSpeciesRequest(
    val speciesId: UUID,
    @field:Min(
        value = ServiceRules.DURATION_MIN_MINUTES.toLong(),
        message = "must be between ${ServiceRules.DURATION_MIN_MINUTES} and ${ServiceRules.DURATION_MAX_MINUTES}",
    )
    @field:Max(
        value = ServiceRules.DURATION_MAX_MINUTES.toLong(),
        message = "must be between ${ServiceRules.DURATION_MIN_MINUTES} and ${ServiceRules.DURATION_MAX_MINUTES}",
    )
    val durationMin: Int? = null,
    @field:DecimalMin(value = "$MONEY_MIN", message = "must be between $MONEY_MIN and $MONEY_MAX")
    @field:DecimalMax(value = "$MONEY_MAX", message = "must be between $MONEY_MIN and $MONEY_MAX")
    val price: Double? = null,
)
