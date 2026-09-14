package com.bortnik.chiron.domain.entities

import java.time.Instant
import java.util.UUID

data class Veterinarian(
    val id: UUID,
    val userId: UUID,
    val specializationId: UUID,
    val bio: String? = null,
    val photoUrl: String? = null,
    val experienceYears: Int,
    val isActive: Boolean = true,
    val createdAt: Instant,
    val updatedAt: Instant,
)
