package com.bortnik.chiron.domain.dto.user

import com.bortnik.chiron.domain.entities.enums.UserRole

data class CreateUserDto(
    val email: String,
    val passwordHash: String,
    val firstName: String,
    val middleName: String? = null,
    val lastName: String,
    val fullName: String,
    val phone: String,
    val role: UserRole,
)
