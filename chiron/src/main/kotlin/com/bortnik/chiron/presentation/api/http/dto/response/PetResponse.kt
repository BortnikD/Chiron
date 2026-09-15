package com.bortnik.chiron.presentation.api.http.dto.response

import com.bortnik.chiron.domain.entities.enums.Gender
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class PetResponse(
    val id: UUID,
    val name: String,
    val ownerId: UUID,
    val speciesId: UUID,
    val birthDate: LocalDate?,
    val weightKg: Double?,
    val gender: Gender,
    val notes: String?,
    val isArchived: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant,
)
