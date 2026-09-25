package com.bortnik.chiron.domain.dto.vaccination

import java.time.LocalDate
import java.util.UUID

// What a veterinarian may filter by: results are always limited to their patients by the application.
data class VeterinarianVaccinationFilter(
    val petId: UUID? = null,
    val name: String? = null,
    val nextDueFrom: LocalDate? = null,
    val nextDueTo: LocalDate? = null,
)
