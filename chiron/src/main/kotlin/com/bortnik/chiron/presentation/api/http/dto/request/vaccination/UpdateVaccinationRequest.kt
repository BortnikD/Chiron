package com.bortnik.chiron.presentation.api.http.dto.request.vaccination

import java.time.LocalDate

data class UpdateVaccinationRequest(
    val name: String,
    val administeredOn: LocalDate,
    val nextDueOn: LocalDate? = null,
)
