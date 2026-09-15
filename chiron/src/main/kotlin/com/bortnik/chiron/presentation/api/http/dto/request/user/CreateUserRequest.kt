package com.bortnik.chiron.presentation.api.http.dto.request.user

import com.bortnik.chiron.domain.entities.enums.UserRole

data class CreateUserRequest(
    val email: String,
    val password: String,
    val firstName: String,
    val middleName: String? = null,
    val lastName: String,
    val phone: String,
    val role: UserRole,
)
