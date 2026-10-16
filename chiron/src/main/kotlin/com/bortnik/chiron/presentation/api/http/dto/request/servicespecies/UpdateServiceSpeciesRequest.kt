package com.bortnik.chiron.presentation.api.http.dto.request.servicespecies

import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MAX
import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MIN
import com.bortnik.chiron.domain.utils.ValidationConstants.ServiceRules
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.openapitools.jackson.nullable.JsonNullable

// Partial update: omitted fields keep their values; an explicit null falls back to the service's base value.
data class UpdateServiceSpeciesRequest(
    @field:Min(
        value = ServiceRules.DURATION_MIN_MINUTES.toLong(),
        message = "must be between ${ServiceRules.DURATION_MIN_MINUTES} and ${ServiceRules.DURATION_MAX_MINUTES}",
    )
    @field:Max(
        value = ServiceRules.DURATION_MAX_MINUTES.toLong(),
        message = "must be between ${ServiceRules.DURATION_MIN_MINUTES} and ${ServiceRules.DURATION_MAX_MINUTES}",
    )
    val durationMin: JsonNullable<Int?> = JsonNullable.undefined(),
    @field:DecimalMin(value = "$MONEY_MIN", message = "must be between $MONEY_MIN and $MONEY_MAX")
    @field:DecimalMax(value = "$MONEY_MAX", message = "must be between $MONEY_MIN and $MONEY_MAX")
    val price: JsonNullable<Double?> = JsonNullable.undefined(),
)
