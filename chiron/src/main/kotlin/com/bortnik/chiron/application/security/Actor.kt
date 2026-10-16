package com.bortnik.chiron.application.security

import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.entities.enums.UserRole
import java.util.UUID

// The user behind the current request. fullName is carried along for audit records and log messages.
data class Actor(
    val userId: UUID,
    val role: UserRole,
    val fullName: String,
)

fun User.toActor(): Actor = Actor(userId = id, role = role, fullName = fullName)
