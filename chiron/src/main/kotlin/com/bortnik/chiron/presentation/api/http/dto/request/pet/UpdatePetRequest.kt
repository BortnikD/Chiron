package com.bortnik.chiron.presentation.api.http.dto.request.pet

import com.bortnik.chiron.domain.entities.enums.Gender
import com.bortnik.chiron.domain.utils.ValidationConstants.PetRules
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.PastOrPresent
import jakarta.validation.constraints.Size
import org.openapitools.jackson.nullable.JsonNullable
import java.time.LocalDate
import java.util.UUID

// Partial update: omitted fields keep their values; JsonNullable fields are cleared by an explicit null.
data class UpdatePetRequest(
    @field:Size(max = PetRules.NAME_MAX_LENGTH, message = "must be at most ${PetRules.NAME_MAX_LENGTH} characters")
    val name: String? = null,
    val speciesId: UUID? = null,
    @field:PastOrPresent(message = "must not be in the future")
    val birthDate: JsonNullable<LocalDate?> = JsonNullable.undefined(),
    @field:DecimalMin(value = "${PetRules.WEIGHT_MIN_EXCLUSIVE}", inclusive = false, message = "must be positive")
    @field:DecimalMax(value = "${PetRules.WEIGHT_MAX}", message = "must be at most ${PetRules.WEIGHT_MAX}")
    val weightKg: JsonNullable<Double?> = JsonNullable.undefined(),
    val gender: Gender? = null,
    @field:Size(max = PetRules.NOTES_MAX_LENGTH, message = "must be at most ${PetRules.NOTES_MAX_LENGTH} characters")
    val notes: JsonNullable<String?> = JsonNullable.undefined(),
    val isArchived: Boolean? = null,
)
