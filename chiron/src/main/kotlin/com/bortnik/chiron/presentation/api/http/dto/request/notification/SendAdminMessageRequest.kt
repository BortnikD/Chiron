package com.bortnik.chiron.presentation.api.http.dto.request.notification

import com.bortnik.chiron.domain.utils.ValidationConstants.NotificationRules
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.util.UUID

data class SendAdminMessageRequest(
    @field:NotBlank(message = "must not be blank")
    @field:Size(
        max = NotificationRules.TITLE_MAX_LENGTH,
        message = "must be at most ${NotificationRules.TITLE_MAX_LENGTH} characters",
    )
    val title: String,
    @field:NotBlank(message = "must not be blank")
    @field:Size(
        max = NotificationRules.BODY_MAX_LENGTH,
        message = "must be at most ${NotificationRules.BODY_MAX_LENGTH} characters",
    )
    val body: String,
    val appointmentId: UUID? = null,
    val petId: UUID? = null,
    val vaccinationId: UUID? = null,
)
