package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.dto.user.CreateUserDto
import com.bortnik.chiron.domain.dto.user.RegisterUserDto
import com.bortnik.chiron.domain.dto.user.UpdateUserDto
import com.bortnik.chiron.domain.dto.user.UserFilter
import com.bortnik.chiron.domain.utils.ValidationConstants.SEARCH_MAX_LENGTH
import com.bortnik.chiron.domain.utils.ValidationConstants.UserRules

object UserValidator {

    // Only the raw password is checked here; the remaining fields are validated as CreateUserDto.
    fun validate(dto: RegisterUserDto) = validateAll {
        ensure(
            dto.password.length >= UserRules.PASSWORD_MIN_LENGTH,
            "password",
            "must be at least ${UserRules.PASSWORD_MIN_LENGTH} characters",
        )
        ensure(
            dto.password.encodeToByteArray().size <= UserRules.PASSWORD_MAX_BYTES,
            "password",
            "must be at most ${UserRules.PASSWORD_MAX_BYTES} bytes",
        )
    }

    fun validate(dto: CreateUserDto) = validateAll {
        user(dto.email, dto.passwordHash, dto.firstName, dto.middleName, dto.lastName, dto.fullName, dto.phone)
    }

    // Only the fields present in the partial update are checked.
    fun validate(dto: UpdateUserDto) = validateAll {
        user(
            dto.email,
            dto.passwordHash,
            dto.firstName,
            dto.middleName.orElse(null),
            dto.lastName,
            dto.fullName,
            dto.phone,
        )
    }

    fun validate(filter: UserFilter) = validateAll {
        ensureMaxLength("search", filter.search, SEARCH_MAX_LENGTH)
        ensureAfter("createdTo", filter.createdTo, "createdFrom", filter.createdFrom)
    }

    fun validateCredentials(email: String, password: String) = validateAll {
        ensureMaxLength("email", email, UserRules.LOGIN_EMAIL_MAX_LENGTH)
        ensureMaxLength("password", password, UserRules.LOGIN_PASSWORD_MAX_LENGTH)
    }

    private fun ValidationErrorCollector.user(
        email: String?,
        passwordHash: String?,
        firstName: String?,
        middleName: String?,
        lastName: String?,
        fullName: String?,
        phone: String?,
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
