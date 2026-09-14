package com.bortnik.chiron.domain.dto.vaccination

import java.time.LocalDate

data class UpdateVaccinationDto(
    val name: String,
    val administeredOn: LocalDate,
    val nextDueOn: LocalDate? = null,
)
