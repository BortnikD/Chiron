package com.bortnik.chiron.presentation.api.http.dto.request.vaccination

import com.bortnik.chiron.domain.utils.ValidationConstants.SEARCH_MAX_LENGTH
import io.swagger.v3.oas.annotations.Parameter
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.util.UUID

data class VaccinationFilterRequest(
    @field:Parameter(description = "Return only vaccinations of this pet")
    val petId: UUID? = null,
    @field:Parameter(description = "Case-insensitive substring of the vaccine name")
    @field:Size(max = SEARCH_MAX_LENGTH, message = "must be at most $SEARCH_MAX_LENGTH characters")
    val name: String? = null,
    @field:Parameter(description = "Next dose due on or after this ISO-8601 date")
    val nextDueFrom: LocalDate? = null,
    @field:Parameter(description = "Next dose due on or before this ISO-8601 date")
    val nextDueTo: LocalDate? = null,
)
