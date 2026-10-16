package com.bortnik.chiron.domain.dto.user

import com.bortnik.chiron.domain.dto.Patch

// Partial update: null / Patch.Unchanged keep the stored value.
data class UpdateUserDto(
    val email: String? = null,
    val firstName: String? = null,
    val middleName: Patch<String?> = Patch.Unchanged,
    val lastName: String? = null,
    val fullName: String? = null,
    val phone: String? = null,
)
