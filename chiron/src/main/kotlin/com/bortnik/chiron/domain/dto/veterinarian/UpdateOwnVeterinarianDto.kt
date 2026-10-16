package com.bortnik.chiron.domain.dto.veterinarian

import com.bortnik.chiron.domain.dto.Patch

// What a veterinarian may change in their own profile: specialization and activity stay admin-only
// because they decide which appointments the veterinarian can take.
// Partial update: null / Patch.Unchanged keep the stored value.
data class UpdateOwnVeterinarianDto(
    val bio: Patch<String?> = Patch.Unchanged,
    val photoUrl: Patch<String?> = Patch.Unchanged,
    val experienceYears: Int? = null,
)
