package com.bortnik.chiron.domain.entities

import com.bortnik.chiron.domain.entities.enums.Gender
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class Pet(
    val id: UUID,
    val name: String,
    val ownerId: UUID,
    val speciesId: UUID,
    val birthDate: LocalDate? = null,
    val weightKg: Double? = null,
    val gender: Gender,
    val notes: String? = null,
    val isArchived: Boolean = false,
    val createdAt: Instant,
    val updatedAt: Instant,
)
