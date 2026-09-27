package com.bortnik.chiron.presentation.api.http.dto.request.user

import com.bortnik.chiron.domain.utils.ValidationConstants.UserRules
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.openapitools.jackson.nullable.JsonNullable

// Partial update: omitted fields keep their values; JsonNullable fields are cleared by an explicit null.
// fullName is not accepted: the server rebuilds it from the name fields.
data class UpdateUserRequest(
    @field:Size(max = UserRules.EMAIL_MAX_LENGTH, message = "must be at most ${UserRules.EMAIL_MAX_LENGTH} characters")
    @field:Pattern(regexp = UserRules.EMAIL_PATTERN, message = "must be a valid email address")
    val email: String? = null,
    @field:Size(max = UserRules.NAME_MAX_LENGTH, message = "must be at most ${UserRules.NAME_MAX_LENGTH} characters")
    val firstName: String? = null,
    @field:Size(max = UserRules.NAME_MAX_LENGTH, message = "must be at most ${UserRules.NAME_MAX_LENGTH} characters")
    val middleName: JsonNullable<String?> = JsonNullable.undefined(),
    @field:Size(max = UserRules.NAME_MAX_LENGTH, message = "must be at most ${UserRules.NAME_MAX_LENGTH} characters")
    val lastName: String? = null,
    @field:Pattern(regexp = UserRules.PHONE_PATTERN, message = "must be a phone number in international format")
    val phone: String? = null,
)
