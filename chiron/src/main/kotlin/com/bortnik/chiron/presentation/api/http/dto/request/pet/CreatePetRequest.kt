package com.bortnik.chiron.presentation.api.http.dto.request.pet

import com.bortnik.chiron.domain.entities.enums.Gender
import com.bortnik.chiron.domain.utils.ValidationConstants.PetRules
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.PastOrPresent
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.util.UUID

data class CreatePetRequest(
    @field:NotBlank(message = "must not be blank")
    @field:Size(max = PetRules.NAME_MAX_LENGTH, message = "must be at most ${PetRules.NAME_MAX_LENGTH} characters")
    val name: String,
    val ownerId: UUID,
    val speciesId: UUID,
    @field:PastOrPresent(message = "must not be in the future")
    val birthDate: LocalDate? = null,
    @field:DecimalMin(value = "${PetRules.WEIGHT_MIN_EXCLUSIVE}", inclusive = false, message = "must be positive")
    @field:DecimalMax(value = "${PetRules.WEIGHT_MAX}", message = "must be at most ${PetRules.WEIGHT_MAX}")
    val weightKg: Double? = null,
    val gender: Gender,
    @field:Size(max = PetRules.NOTES_MAX_LENGTH, message = "must be at most ${PetRules.NOTES_MAX_LENGTH} characters")
    val notes: String? = null,
)
