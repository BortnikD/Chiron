package com.bortnik.chiron.presentation.api.http.dto.request.vaccination

import io.swagger.v3.oas.annotations.Parameter
import java.time.LocalDate
import java.util.UUID

data class ClientVaccinationFilterRequest(
    @field:Parameter(description = "Return only vaccinations of this own pet; omit for all own pets")
    val petId: UUID? = null,
    @field:Parameter(description = "Next dose due on or after this ISO-8601 date")
    val nextDueFrom: LocalDate? = null,
    @field:Parameter(description = "Next dose due on or before this ISO-8601 date")
    val nextDueTo: LocalDate? = null,
)
