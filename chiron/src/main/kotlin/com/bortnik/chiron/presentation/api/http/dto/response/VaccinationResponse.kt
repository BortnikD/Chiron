package com.bortnik.chiron.presentation.api.http.dto.response

import java.time.LocalDate
import java.util.UUID

data class VaccinationResponse(
    val id: UUID,
    val petId: UUID,
    val appointmentId: UUID?,
    val name: String,
    val administeredOn: LocalDate,
    val nextDueOn: LocalDate?,
)
