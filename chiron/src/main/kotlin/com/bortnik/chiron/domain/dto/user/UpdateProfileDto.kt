package com.bortnik.chiron.domain.dto.user

import com.bortnik.chiron.domain.dto.Patch

// Personal data a user edits about themselves (or an admin about anyone); fullName is not included
// because it is derived from the name fields. Partial update: null / Patch.Unchanged keep the stored value.
data class UpdateProfileDto(
    val email: String? = null,
    val firstName: String? = null,
    val middleName: Patch<String?> = Patch.Unchanged,
    val lastName: String? = null,
    val phone: String? = null,
)
