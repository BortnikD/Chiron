package com.bortnik.chiron.domain.dto.pet

import com.bortnik.chiron.domain.entities.enums.Gender
import java.time.LocalDate
import java.util.UUID

// What a client sends when adding a pet: the owner is taken from the current user, not from the request.
data class CreateOwnPetDto(
    val name: String,
    val speciesId: UUID,
    val birthDate: LocalDate? = null,
    val weightKg: Double? = null,
    val gender: Gender,
    val notes: String? = null,
)
