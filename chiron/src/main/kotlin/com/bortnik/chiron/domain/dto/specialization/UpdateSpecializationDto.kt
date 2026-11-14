package com.bortnik.chiron.domain.dto.specialization

import com.bortnik.chiron.domain.dto.Patch

// Partial update: null keeps non-nullable columns; Patch.Value(null) clears nullable columns.
data class UpdateSpecializationDto(
    val name: String? = null,
    val description: String? = null,
    val color: Patch<String?> = Patch.Unchanged,
)
