package com.bortnik.chiron.presentation.api.http.dto.request.user

import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.utils.ValidationConstants.UserRules
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

// The password byte limit (PASSWORD_MAX_BYTES) has no standard constraint; UserValidator checks it.
data class CreateUserRequest(
    @field:NotBlank(message = "must not be blank")
    @field:Size(max = UserRules.EMAIL_MAX_LENGTH, message = "must be at most ${UserRules.EMAIL_MAX_LENGTH} characters")
    @field:Pattern(regexp = UserRules.EMAIL_PATTERN, message = "must be a valid email address")
    val email: String,
    @field:Size(
        min = UserRules.PASSWORD_MIN_LENGTH,
        message = "must be at least ${UserRules.PASSWORD_MIN_LENGTH} characters",
    )
    val password: String,
    @field:NotBlank(message = "must not be blank")
    @field:Size(max = UserRules.NAME_MAX_LENGTH, message = "must be at most ${UserRules.NAME_MAX_LENGTH} characters")
    val firstName: String,
    @field:Size(max = UserRules.NAME_MAX_LENGTH, message = "must be at most ${UserRules.NAME_MAX_LENGTH} characters")
    val middleName: String? = null,
    @field:NotBlank(message = "must not be blank")
    @field:Size(max = UserRules.NAME_MAX_LENGTH, message = "must be at most ${UserRules.NAME_MAX_LENGTH} characters")
    val lastName: String,
    @field:Pattern(regexp = UserRules.PHONE_PATTERN, message = "must be a phone number in international format")
    val phone: String,
    val role: UserRole,
)
