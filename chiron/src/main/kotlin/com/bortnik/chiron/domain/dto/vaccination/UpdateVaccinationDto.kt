package com.bortnik.chiron.domain.dto.vaccination

import com.bortnik.chiron.domain.dto.Patch
import java.time.LocalDate

// Partial update: null / Patch.Unchanged keep the stored value.
data class UpdateVaccinationDto(
    val name: String? = null,
    val administeredOn: LocalDate? = null,
    val nextDueOn: Patch<LocalDate?> = Patch.Unchanged,
)
