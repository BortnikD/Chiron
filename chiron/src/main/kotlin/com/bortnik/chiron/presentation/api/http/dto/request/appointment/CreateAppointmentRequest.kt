package com.bortnik.chiron.presentation.api.http.dto.request.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.utils.ValidationConstants.AppointmentRules
import jakarta.validation.constraints.Size
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

data class CreateAppointmentRequest(
    val veterinarianId: UUID,
    val petId: UUID,
    @field:Size(
        min = 1,
        max = AppointmentRules.MAX_SERVICES,
        message = "must contain between 1 and ${AppointmentRules.MAX_SERVICES} services",
    )
    val serviceIds: List<@NotNull UUID>,
    val followUpOf: UUID? = null,
    val startAt: Instant,
    val endAt: Instant,
    val status: AppointmentStatus = AppointmentStatus.PENDING,
    @field:Size(
        max = AppointmentRules.CLIENT_COMMENT_MAX_LENGTH,
        message = "must be at most ${AppointmentRules.CLIENT_COMMENT_MAX_LENGTH} characters",
    )
    val clientComment: String? = null,
)
