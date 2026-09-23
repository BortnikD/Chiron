package com.bortnik.chiron.presentation.api.http.dto.request.veterinarian

import com.bortnik.chiron.domain.utils.ValidationConstants.VeterinarianRules
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Size
import java.util.UUID

data class CreateVeterinarianRequest(
    val userId: UUID,
    val specializationId: UUID,
    @field:Size(
        max = VeterinarianRules.BIO_MAX_LENGTH,
        message = "must be at most ${VeterinarianRules.BIO_MAX_LENGTH} characters",
    )
    val bio: String? = null,
    @field:Size(
        max = VeterinarianRules.PHOTO_URL_MAX_LENGTH,
        message = "must be at most ${VeterinarianRules.PHOTO_URL_MAX_LENGTH} characters",
    )
    val photoUrl: String? = null,
    @field:Min(
        value = VeterinarianRules.EXPERIENCE_YEARS_MIN.toLong(),
        message = "must be between ${VeterinarianRules.EXPERIENCE_YEARS_MIN} and ${VeterinarianRules.EXPERIENCE_YEARS_MAX}",
    )
    @field:Max(
        value = VeterinarianRules.EXPERIENCE_YEARS_MAX.toLong(),
        message = "must be between ${VeterinarianRules.EXPERIENCE_YEARS_MIN} and ${VeterinarianRules.EXPERIENCE_YEARS_MAX}",
    )
    val experienceYears: Int,
    val isActive: Boolean = true,
)
