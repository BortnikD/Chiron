package com.bortnik.chiron.presentation.api.http.dto.request.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.utils.ValidationConstants.AppointmentRules
import jakarta.validation.constraints.Size

data class VeterinarianUpdateAppointmentRequest(
    val status: AppointmentStatus,
    @field:Size(
        max = AppointmentRules.VET_NOTES_MAX_LENGTH,
        message = "must be at most ${AppointmentRules.VET_NOTES_MAX_LENGTH} characters",
    )
    val vetNotes: String? = null,
    @field:Size(
        max = AppointmentRules.CANCEL_REASON_MAX_LENGTH,
        message = "must be at most ${AppointmentRules.CANCEL_REASON_MAX_LENGTH} characters",
    )
    val cancelReason: String? = null,
)
