package com.bortnik.chiron.domain.dto.pet

import com.bortnik.chiron.domain.entities.enums.Gender
import java.time.LocalDate
import java.util.UUID

data class UpdatePetDto(
    val name: String,
    val speciesId: UUID,
    val birthDate: LocalDate? = null,
    val weightKg: Double? = null,
    val gender: Gender,
    val notes: String? = null,
    val isArchived: Boolean,
)
