package com.bortnik.chiron.presentation.api.http.dto.request.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.utils.ValidationConstants.AppointmentRules
import jakarta.validation.constraints.Size
import org.openapitools.jackson.nullable.JsonNullable
import java.time.Instant
import java.util.UUID

// Partial update: omitted fields keep their values; JsonNullable fields are cleared by an explicit null.
data class UpdateAppointmentRequest(
    val veterinarianId: UUID? = null,
    val startAt: Instant? = null,
    val endAt: Instant? = null,
    val status: AppointmentStatus? = null,
    @field:Size(
        max = AppointmentRules.CLIENT_COMMENT_MAX_LENGTH,
        message = "must be at most ${AppointmentRules.CLIENT_COMMENT_MAX_LENGTH} characters",
    )
    val clientComment: JsonNullable<String?> = JsonNullable.undefined(),
    @field:Size(
        max = AppointmentRules.VET_NOTES_MAX_LENGTH,
        message = "must be at most ${AppointmentRules.VET_NOTES_MAX_LENGTH} characters",
    )
    val vetNotes: JsonNullable<String?> = JsonNullable.undefined(),
    val cancelledBy: JsonNullable<UUID?> = JsonNullable.undefined(),
    val cancelledAt: JsonNullable<Instant?> = JsonNullable.undefined(),
    @field:Size(
        max = AppointmentRules.CANCEL_REASON_MAX_LENGTH,
        message = "must be at most ${AppointmentRules.CANCEL_REASON_MAX_LENGTH} characters",
    )
    val cancelReason: JsonNullable<String?> = JsonNullable.undefined(),
)
