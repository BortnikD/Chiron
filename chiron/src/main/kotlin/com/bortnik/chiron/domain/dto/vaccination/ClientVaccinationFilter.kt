package com.bortnik.chiron.domain.dto.vaccination

import java.time.LocalDate
import java.util.UUID

data class ClientVaccinationFilter(
    val petId: UUID? = null,
    val nextDueFrom: LocalDate? = null,
    val nextDueTo: LocalDate? = null,
)
