package com.bortnik.chiron.presentation.api.http.dto.response

import com.bortnik.chiron.domain.entities.enums.UserRole
import java.time.Instant
import java.util.UUID

data class UserResponse(
    val id: UUID,
    val email: String,
    val firstName: String,
    val middleName: String?,
    val lastName: String,
    val fullName: String,
    val phone: String,
    val role: UserRole,
    val createdAt: Instant,
    val updatedAt: Instant,
)
