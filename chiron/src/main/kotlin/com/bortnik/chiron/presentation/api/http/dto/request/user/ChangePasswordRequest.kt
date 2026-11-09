package com.bortnik.chiron.presentation.api.http.dto.request.user

import com.bortnik.chiron.domain.utils.ValidationConstants.UserRules
import jakarta.validation.constraints.Size

data class ChangePasswordRequest(
    @field:Size(
        max = UserRules.LOGIN_PASSWORD_MAX_LENGTH,
        message = "must be at most ${UserRules.LOGIN_PASSWORD_MAX_LENGTH} characters",
    )
    val currentPassword: String,
    @field:Size(
        min = UserRules.PASSWORD_MIN_LENGTH,
        message = "must be at least ${UserRules.PASSWORD_MIN_LENGTH} characters",
    )
    val newPassword: String,
)
