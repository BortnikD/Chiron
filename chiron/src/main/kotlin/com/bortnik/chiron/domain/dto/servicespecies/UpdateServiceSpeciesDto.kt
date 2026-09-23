package com.bortnik.chiron.domain.dto.servicespecies

import com.bortnik.chiron.domain.dto.Patch

// Partial update: Patch.Unchanged keeps the stored override, Patch.Value(null) falls back to the service's base value.
data class UpdateServiceSpeciesDto(
    val durationMin: Patch<Int?> = Patch.Unchanged,
    val price: Patch<Double?> = Patch.Unchanged,
)
