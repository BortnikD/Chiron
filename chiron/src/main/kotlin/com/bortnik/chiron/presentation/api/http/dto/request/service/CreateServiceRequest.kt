package com.bortnik.chiron.presentation.api.http.dto.request.service

import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MAX
import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MIN
import com.bortnik.chiron.domain.utils.ValidationConstants.ServiceRules
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.util.UUID

data class CreateServiceRequest(
    val specializationId: UUID,
    @field:NotBlank(message = "must not be blank")
    @field:Size(
        max = ServiceRules.NAME_MAX_LENGTH,
        message = "must be at most ${ServiceRules.NAME_MAX_LENGTH} characters",
    )
    val name: String,
    @field:Size(
        max = ServiceRules.DESCRIPTION_MAX_LENGTH,
        message = "must be at most ${ServiceRules.DESCRIPTION_MAX_LENGTH} characters",
    )
    val description: String,
    @field:DecimalMin(value = "$MONEY_MIN", message = "must be between $MONEY_MIN and $MONEY_MAX")
    @field:DecimalMax(value = "$MONEY_MAX", message = "must be between $MONEY_MIN and $MONEY_MAX")
    val basePrice: Double,
    @field:Min(
        value = ServiceRules.DURATION_MIN_MINUTES.toLong(),
        message = "must be between ${ServiceRules.DURATION_MIN_MINUTES} and ${ServiceRules.DURATION_MAX_MINUTES}",
    )
    @field:Max(
        value = ServiceRules.DURATION_MAX_MINUTES.toLong(),
        message = "must be between ${ServiceRules.DURATION_MIN_MINUTES} and ${ServiceRules.DURATION_MAX_MINUTES}",
    )
    val baseDurationMin: Int,
    @field:Min(
        value = ServiceRules.BUFFER_MIN_MINUTES.toLong(),
        message = "must be between ${ServiceRules.BUFFER_MIN_MINUTES} and ${ServiceRules.BUFFER_MAX_MINUTES}",
    )
    @field:Max(
        value = ServiceRules.BUFFER_MAX_MINUTES.toLong(),
        message = "must be between ${ServiceRules.BUFFER_MIN_MINUTES} and ${ServiceRules.BUFFER_MAX_MINUTES}",
    )
    val bufferAfterMin: Int = 0,
    val isActive: Boolean = true,
)
