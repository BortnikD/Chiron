package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVeterinarianTable
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toVeterinarian(): Veterinarian = Veterinarian(
    id = this[ExposedVeterinarianTable.id].value,
    userId = this[ExposedVeterinarianTable.userId].value,
    specializationId = this[ExposedVeterinarianTable.specializationId].value,
    bio = this[ExposedVeterinarianTable.bio],
    photoUrl = this[ExposedVeterinarianTable.photoUrl],
    experienceYears = this[ExposedVeterinarianTable.experienceYears],
    isActive = this[ExposedVeterinarianTable.isActive],
    createdAt = this[ExposedVeterinarianTable.createdAt].toInstant(),
    updatedAt = this[ExposedVeterinarianTable.updatedAt].toInstant(),
)
