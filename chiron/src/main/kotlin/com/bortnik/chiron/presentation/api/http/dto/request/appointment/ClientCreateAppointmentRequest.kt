package com.bortnik.chiron.presentation.api.http.dto.request.appointment

import com.bortnik.chiron.domain.utils.ValidationConstants.AppointmentRules
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

data class ClientCreateAppointmentRequest(
    val veterinarianId: UUID,
    val petId: UUID,
    val serviceId: UUID,
    val startAt: Instant,
    val endAt: Instant,
    @field:Size(
        max = AppointmentRules.CLIENT_COMMENT_MAX_LENGTH,
        message = "must be at most ${AppointmentRules.CLIENT_COMMENT_MAX_LENGTH} characters",
    )
    val clientComment: String? = null,
)
