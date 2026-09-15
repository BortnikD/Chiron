package com.bortnik.chiron.presentation.api.http.dto.response

import java.time.Instant
import java.util.UUID

data class VeterinarianResponse(
    val id: UUID,
    val userId: UUID,
    val specializationId: UUID,
    val bio: String?,
    val photoUrl: String?,
    val experienceYears: Int,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant,
)
