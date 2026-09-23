package com.bortnik.chiron.presentation.api.http.dto.request.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.utils.ValidationConstants.AppointmentRules
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

data class UpdateAppointmentRequest(
    val veterinarianId: UUID,
    val startAt: Instant,
    val endAt: Instant,
    val status: AppointmentStatus,
    @field:Size(
        max = AppointmentRules.CLIENT_COMMENT_MAX_LENGTH,
        message = "must be at most ${AppointmentRules.CLIENT_COMMENT_MAX_LENGTH} characters",
    )
    val clientComment: String? = null,
    @field:Size(
        max = AppointmentRules.VET_NOTES_MAX_LENGTH,
        message = "must be at most ${AppointmentRules.VET_NOTES_MAX_LENGTH} characters",
    )
    val vetNotes: String? = null,
    val cancelledBy: UUID? = null,
    val cancelledAt: Instant? = null,
    @field:Size(
        max = AppointmentRules.CANCEL_REASON_MAX_LENGTH,
        message = "must be at most ${AppointmentRules.CANCEL_REASON_MAX_LENGTH} characters",
    )
    val cancelReason: String? = null,
)
