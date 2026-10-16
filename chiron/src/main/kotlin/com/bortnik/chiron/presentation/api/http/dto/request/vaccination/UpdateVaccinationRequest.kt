package com.bortnik.chiron.presentation.api.http.dto.request.vaccination

import com.bortnik.chiron.domain.utils.ValidationConstants.VaccinationRules
import jakarta.validation.constraints.PastOrPresent
import jakarta.validation.constraints.Size
import org.openapitools.jackson.nullable.JsonNullable
import java.time.LocalDate

// Partial update: omitted fields keep their values; nextDueOn is cleared by an explicit null.
data class UpdateVaccinationRequest(
    @field:Size(
        max = VaccinationRules.NAME_MAX_LENGTH,
        message = "must be at most ${VaccinationRules.NAME_MAX_LENGTH} characters",
    )
    val name: String? = null,
    @field:PastOrPresent(message = "must not be in the future")
    val administeredOn: LocalDate? = null,
    val nextDueOn: JsonNullable<LocalDate?> = JsonNullable.undefined(),
)
