package com.bortnik.chiron.presentation.api.http.dto.request.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.utils.ValidationConstants.AppointmentRules
import jakarta.validation.constraints.Size
import org.openapitools.jackson.nullable.JsonNullable

// Partial update: omitted fields keep their values; vetNotes is cleared by an explicit null.
data class VeterinarianUpdateAppointmentRequest(
    val status: AppointmentStatus? = null,
    @field:Size(
        max = AppointmentRules.VET_NOTES_MAX_LENGTH,
        message = "must be at most ${AppointmentRules.VET_NOTES_MAX_LENGTH} characters",
    )
    val vetNotes: JsonNullable<String?> = JsonNullable.undefined(),
    @field:Size(
        max = AppointmentRules.CANCEL_REASON_MAX_LENGTH,
        message = "must be at most ${AppointmentRules.CANCEL_REASON_MAX_LENGTH} characters",
    )
    val cancelReason: String? = null,
)
