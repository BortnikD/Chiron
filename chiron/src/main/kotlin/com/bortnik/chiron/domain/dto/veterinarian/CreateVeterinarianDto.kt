package com.bortnik.chiron.domain.dto.veterinarian

import java.util.UUID

data class CreateVeterinarianDto(
    val userId: UUID,
    val specializationId: UUID,
    val bio: String? = null,
    val photoUrl: String? = null,
    val experienceYears: Int,
    val isActive: Boolean = true,
)
