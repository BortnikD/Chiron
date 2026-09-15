package com.bortnik.chiron.presentation.api.http.dto.request.vaccination

import java.time.LocalDate
import java.util.UUID

data class CreateVaccinationRequest(
    val petId: UUID,
    val appointmentId: UUID? = null,
    val name: String,
    val administeredOn: LocalDate,
    val nextDueOn: LocalDate? = null,
)
