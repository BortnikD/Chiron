package com.bortnik.chiron.domain.entities

import com.bortnik.chiron.domain.entities.enums.UserRole
import java.time.Instant
import java.util.UUID

data class User(
    val id: UUID,
    val email: String,
    val passwordHash: String,
    val firstName: String,
    val middleName: String? = null,
    val lastName: String,
    val fullName: String,
    val phone: String,
    val role: UserRole,
    val createdAt: Instant,
    val updatedAt: Instant
)
