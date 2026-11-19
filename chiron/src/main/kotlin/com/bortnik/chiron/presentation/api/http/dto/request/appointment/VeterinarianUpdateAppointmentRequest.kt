package com.bortnik.chiron.presentation.api.http.dto.request.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.utils.ValidationConstants.AppointmentRules
import jakarta.validation.constraints.Size
import jakarta.validation.constraints.NotNull
import org.openapitools.jackson.nullable.JsonNullable
import java.time.Instant
import java.util.UUID

// Partial update: omitted fields keep their values; vetNotes is cleared by an explicit null.
data class VeterinarianUpdateAppointmentRequest(
    val status: AppointmentStatus? = null,
    @field:Size(
        min = 1,
        max = AppointmentRules.MAX_SERVICES,
        message = "must contain between 1 and ${AppointmentRules.MAX_SERVICES} services",
    )
    val serviceIds: List<@NotNull UUID>? = null,
    @field:Size(
        max = AppointmentRules.MAX_SERVICES,
        message = "must contain at most ${AppointmentRules.MAX_SERVICES} services",
    )
    val performedServiceIds: List<@NotNull UUID>? = null,
    val endAt: Instant? = null,
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
