package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.dto.veterinarian.CreateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.utils.ValidationConstants.VeterinarianRules

object VeterinarianValidator {

    fun validate(dto: CreateVeterinarianDto) = validateAll { veterinarian(dto.bio, dto.photoUrl, dto.experienceYears) }

    // Only the fields present in the partial update are checked.
    fun validate(dto: UpdateVeterinarianDto) = validateAll {
        veterinarian(dto.bio.orElse(null), dto.photoUrl.orElse(null), dto.experienceYears)
    }

    private fun ValidationErrorCollector.veterinarian(bio: String?, photoUrl: String?, experienceYears: Int?) {
        ensureMaxLength("bio", bio, VeterinarianRules.BIO_MAX_LENGTH)
        ensureMaxLength("photoUrl", photoUrl, VeterinarianRules.PHOTO_URL_MAX_LENGTH)
        ensureInRange("experienceYears", experienceYears, VeterinarianRules.EXPERIENCE_YEARS_MIN, VeterinarianRules.EXPERIENCE_YEARS_MAX)
    }
}
