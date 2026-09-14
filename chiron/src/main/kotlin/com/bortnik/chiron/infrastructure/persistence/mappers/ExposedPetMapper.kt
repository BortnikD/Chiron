package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.infrastructure.persistence.models.ExposedPetTable
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toPet(): Pet = Pet(
    id = this[ExposedPetTable.id].value,
    name = this[ExposedPetTable.name],
    ownerId = this[ExposedPetTable.ownerId].value,
    speciesId = this[ExposedPetTable.speciesId].value,
    birthDate = this[ExposedPetTable.birthDate],
    weightKg = this[ExposedPetTable.weightKg]?.toDouble(),
    gender = this[ExposedPetTable.gender],
    notes = this[ExposedPetTable.notes],
    isArchived = this[ExposedPetTable.isArchived],
    createdAt = this[ExposedPetTable.createdAt].toInstant(),
    updatedAt = this[ExposedPetTable.updatedAt].toInstant(),
)
