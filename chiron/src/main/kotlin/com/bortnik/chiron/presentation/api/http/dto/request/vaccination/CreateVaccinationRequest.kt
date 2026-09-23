package com.bortnik.chiron.presentation.api.http.dto.request.vaccination

import com.bortnik.chiron.domain.utils.ValidationConstants.VaccinationRules
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.PastOrPresent
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.util.UUID

data class CreateVaccinationRequest(
    val petId: UUID,
    val appointmentId: UUID? = null,
    @field:NotBlank(message = "must not be blank")
    @field:Size(
        max = VaccinationRules.NAME_MAX_LENGTH,
        message = "must be at most ${VaccinationRules.NAME_MAX_LENGTH} characters",
    )
    val name: String,
    @field:PastOrPresent(message = "must not be in the future")
    val administeredOn: LocalDate,
    val nextDueOn: LocalDate? = null,
)
