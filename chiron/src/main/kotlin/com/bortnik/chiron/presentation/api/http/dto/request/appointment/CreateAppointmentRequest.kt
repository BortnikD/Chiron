package com.bortnik.chiron.presentation.api.http.dto.request.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.utils.ValidationConstants.AppointmentRules
import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MAX
import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MIN
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

data class CreateAppointmentRequest(
    val veterinarianId: UUID,
    val petId: UUID,
    val serviceId: UUID,
    val followUpOf: UUID? = null,
    val startAt: Instant,
    val endAt: Instant,
    val status: AppointmentStatus = AppointmentStatus.PENDING,
    @field:DecimalMin(value = "$MONEY_MIN", message = "must be between $MONEY_MIN and $MONEY_MAX")
    @field:DecimalMax(value = "$MONEY_MAX", message = "must be between $MONEY_MIN and $MONEY_MAX")
    val priceSnapshot: Double,
    @field:Size(
        max = AppointmentRules.CLIENT_COMMENT_MAX_LENGTH,
        message = "must be at most ${AppointmentRules.CLIENT_COMMENT_MAX_LENGTH} characters",
    )
    val clientComment: String? = null,
)
