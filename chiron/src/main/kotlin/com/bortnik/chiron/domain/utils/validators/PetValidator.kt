package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.dto.pet.CreatePetDto
import com.bortnik.chiron.domain.dto.pet.PetFilter
import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.domain.utils.ValidationConstants.PetRules
import com.bortnik.chiron.domain.utils.ValidationConstants.SEARCH_MAX_LENGTH
import java.time.LocalDate

object PetValidator {

    fun validate(filter: PetFilter) = validateAll {
        ensureMaxLength("name", filter.name, SEARCH_MAX_LENGTH)
    }

    fun validate(dto: CreatePetDto, today: LocalDate) = validateAll {
        pet(dto.name, dto.birthDate, dto.weightKg, dto.notes, today)
        ensureMaxLength("breed", dto.breed, PetRules.BREED_MAX_LENGTH)
    }

    // Only the fields present in the partial update are checked.
    fun validate(dto: UpdatePetDto, today: LocalDate) = validateAll {
        pet(dto.name, dto.birthDate.orElse(null), dto.weightKg.orElse(null), dto.notes.orElse(null), today)
        ensureMaxLength("breed", dto.breed.orElse(null), PetRules.BREED_MAX_LENGTH)
    }

    private fun ValidationErrorCollector.pet(
        name: String?, birthDate: LocalDate?, weightKg: Double?, notes: String?, today: LocalDate,
    ) {
        ensureNotBlank("name", name)
        ensureMaxLength("name", name, PetRules.NAME_MAX_LENGTH)
        ensure(birthDate == null || !birthDate.isAfter(today), "birthDate", "must not be in the future")
        ensure(weightKg == null || weightKg > PetRules.WEIGHT_MIN_EXCLUSIVE, "weightKg", "must be positive")
        ensure(weightKg == null || weightKg <= PetRules.WEIGHT_MAX, "weightKg", "must be at most ${PetRules.WEIGHT_MAX}")
        ensureMaxLength("notes", notes, PetRules.NOTES_MAX_LENGTH)
    }
}
