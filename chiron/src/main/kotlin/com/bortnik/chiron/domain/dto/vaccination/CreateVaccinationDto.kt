package com.bortnik.chiron.domain.dto.vaccination

import java.time.LocalDate
import java.util.UUID

data class CreateVaccinationDto(
    val petId: UUID,
    val appointmentId: UUID? = null,
    val name: String,
    val administeredOn: LocalDate,
    val nextDueOn: LocalDate? = null,
)
