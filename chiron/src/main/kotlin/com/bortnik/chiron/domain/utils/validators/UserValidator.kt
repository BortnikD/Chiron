package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.user.CreateUserDto
import com.bortnik.chiron.domain.dto.user.UpdateUserDto
import com.bortnik.chiron.domain.utils.ValidationConstants.UserRules

object UserValidator {

    fun validate(dto: CreateUserDto) = validateAll {
        user(dto.email, dto.passwordHash, dto.firstName, dto.middleName, dto.lastName, dto.fullName, dto.phone)
    }

    fun validate(dto: UpdateUserDto) = validateAll {
        user(dto.email, dto.passwordHash, dto.firstName, dto.middleName, dto.lastName, dto.fullName, dto.phone)
    }

    private fun ValidationErrorCollector.user(
        email: String,
        passwordHash: String,
        firstName: String,
        middleName: String?,
        lastName: String,
        fullName: String,
        phone: String,
    ) {
        ensureNotBlank("email", email)
        ensureMaxLength("email", email, UserRules.EMAIL_MAX_LENGTH)
        ensureMatches("email", email, UserRules.EMAIL_REGEX, "must be a valid email address")
        ensureNotBlank("passwordHash", passwordHash)
        ensureNotBlank("firstName", firstName)
        ensureMaxLength("firstName", firstName, UserRules.NAME_MAX_LENGTH)
        ensureMaxLength("middleName", middleName, UserRules.NAME_MAX_LENGTH)
        ensureNotBlank("lastName", lastName)
        ensureMaxLength("lastName", lastName, UserRules.NAME_MAX_LENGTH)
        ensureNotBlank("fullName", fullName)
        ensureMaxLength("fullName", fullName, UserRules.FULL_NAME_MAX_LENGTH)
        ensureMatches("phone", phone, UserRules.PHONE_REGEX, "must be a phone number in international format")
    }
}
