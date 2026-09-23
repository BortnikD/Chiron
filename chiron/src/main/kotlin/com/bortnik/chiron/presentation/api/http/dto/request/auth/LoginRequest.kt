package com.bortnik.chiron.presentation.api.http.dto.request.auth

import com.bortnik.chiron.domain.utils.ValidationConstants.UserRules
import jakarta.validation.constraints.Size

data class LoginRequest(
    @field:Size(
        max = UserRules.LOGIN_EMAIL_MAX_LENGTH,
        message = "must be at most ${UserRules.LOGIN_EMAIL_MAX_LENGTH} characters",
    )
    val email: String,
    @field:Size(
        max = UserRules.LOGIN_PASSWORD_MAX_LENGTH,
        message = "must be at most ${UserRules.LOGIN_PASSWORD_MAX_LENGTH} characters",
    )
    val password: String,
)
