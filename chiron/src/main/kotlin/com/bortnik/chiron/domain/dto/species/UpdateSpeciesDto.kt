package com.bortnik.chiron.domain.dto.species

import com.bortnik.chiron.domain.dto.Patch

// Partial update: null keeps non-nullable columns; Patch.Value(null) clears nullable columns.
data class UpdateSpeciesDto(
    val name: String? = null,
    val color: Patch<String?> = Patch.Unchanged,
    val iconKey: Patch<String?> = Patch.Unchanged,
)
