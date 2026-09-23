package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.dto.pet.CreatePetDto
import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.domain.utils.ValidationConstants.PetRules
import java.time.LocalDate

object PetValidator {

    fun validate(dto: CreatePetDto) = validateAll {
        pet(dto.name, dto.birthDate, dto.weightKg, dto.notes)
    }

    // Only the fields present in the partial update are checked.
    fun validate(dto: UpdatePetDto) = validateAll {
        pet(dto.name, dto.birthDate.orElse(null), dto.weightKg.orElse(null), dto.notes.orElse(null))
    }

    private fun ValidationErrorCollector.pet(name: String?, birthDate: LocalDate?, weightKg: Double?, notes: String?) {
        ensureNotBlank("name", name)
        ensureMaxLength("name", name, PetRules.NAME_MAX_LENGTH)
        ensure(birthDate == null || !birthDate.isAfter(LocalDate.now()), "birthDate", "must not be in the future")
        ensure(weightKg == null || weightKg > PetRules.WEIGHT_MIN_EXCLUSIVE, "weightKg", "must be positive")
        ensure(weightKg == null || weightKg <= PetRules.WEIGHT_MAX, "weightKg", "must be at most ${PetRules.WEIGHT_MAX}")
        ensureMaxLength("notes", notes, PetRules.NOTES_MAX_LENGTH)
    }
}
