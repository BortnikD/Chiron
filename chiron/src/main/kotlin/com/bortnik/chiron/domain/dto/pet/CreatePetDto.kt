package com.bortnik.chiron.domain.dto.pet

import com.bortnik.chiron.domain.entities.enums.Gender
import java.time.LocalDate
import java.util.UUID

data class CreatePetDto(
    val name: String,
    val ownerId: UUID,
    val speciesId: UUID,
    val birthDate: LocalDate? = null,
    val weightKg: Double? = null,
    val gender: Gender,
    val notes: String? = null,
)
