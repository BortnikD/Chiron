package com.bortnik.chiron.domain.dto.user

import com.bortnik.chiron.domain.entities.enums.UserRole

data class RegisterUserDto(
    val email: String,
    val password: String,
    val firstName: String,
    val middleName: String? = null,
    val lastName: String,
    val phone: String,
    val role: UserRole,
)
