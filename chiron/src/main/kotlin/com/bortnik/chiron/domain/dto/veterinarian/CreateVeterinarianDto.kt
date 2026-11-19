package com.bortnik.chiron.domain.dto.veterinarian

import java.util.UUID

data class CreateVeterinarianDto(
    val userId: UUID,
    val specializationId: UUID? = null,
    val bio: String? = null,
    val experienceYears: Int,
    val isActive: Boolean = true,
    val specializationIds: List<UUID> = listOfNotNull(specializationId),
)
