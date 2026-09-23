package com.bortnik.chiron.domain.dto.veterinarian

import com.bortnik.chiron.domain.dto.Patch
import java.util.UUID

// Partial update: null / Patch.Unchanged keep the stored value.
data class UpdateVeterinarianDto(
    val specializationId: UUID? = null,
    val bio: Patch<String?> = Patch.Unchanged,
    val photoUrl: Patch<String?> = Patch.Unchanged,
    val experienceYears: Int? = null,
    val isActive: Boolean? = null,
)
