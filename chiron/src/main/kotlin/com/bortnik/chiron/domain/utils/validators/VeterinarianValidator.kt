package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.dto.veterinarian.CreateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.utils.ValidationConstants.VeterinarianRules
import java.util.UUID

object VeterinarianValidator {

    fun validate(dto: CreateVeterinarianDto) = validateAll {
        veterinarian(dto.bio, dto.experienceYears)
        specializations(dto.specializationId, dto.specializationIds)
    }

    // Only the fields present in the partial update are checked.
    fun validate(dto: UpdateVeterinarianDto) = validateAll {
        veterinarian(dto.bio.orElse(null), dto.experienceYears)
        dto.specializationIds?.let { specializations(dto.specializationId, it) }
    }

    private fun ValidationErrorCollector.specializations(primaryId: UUID?, ids: List<UUID>) {
        ensure(ids.isNotEmpty(), "specializationIds", "must not be empty")
        ensure(ids.distinct().size == ids.size, "specializationIds", "must not contain duplicates")
        ensure(primaryId == null || primaryId in ids, "specializationId", "must belong to specializationIds")
    }

    private fun ValidationErrorCollector.veterinarian(bio: String?, experienceYears: Int?) {
        ensureMaxLength("bio", bio, VeterinarianRules.BIO_MAX_LENGTH)
        ensureInRange(
            "experienceYears",
            experienceYears,
            VeterinarianRules.EXPERIENCE_YEARS_MIN,
            VeterinarianRules.EXPERIENCE_YEARS_MAX
        )
    }
}
