package com.bortnik.chiron.domain.dto.pet

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.entities.enums.Gender
import java.time.LocalDate
import java.util.UUID

// Partial update: null / Patch.Unchanged keep the stored value.
data class UpdatePetDto(
    val name: String? = null,
    val speciesId: UUID? = null,
    val birthDate: Patch<LocalDate?> = Patch.Unchanged,
    val weightKg: Patch<Double?> = Patch.Unchanged,
    val gender: Gender? = null,
    val notes: Patch<String?> = Patch.Unchanged,
    val isArchived: Boolean? = null,
)
