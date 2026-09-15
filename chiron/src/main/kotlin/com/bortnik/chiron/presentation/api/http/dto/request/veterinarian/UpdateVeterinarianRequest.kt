package com.bortnik.chiron.presentation.api.http.dto.request.veterinarian

import java.util.UUID

data class UpdateVeterinarianRequest(
    val specializationId: UUID,
    val bio: String? = null,
    val photoUrl: String? = null,
    val experienceYears: Int,
    val isActive: Boolean,
)
