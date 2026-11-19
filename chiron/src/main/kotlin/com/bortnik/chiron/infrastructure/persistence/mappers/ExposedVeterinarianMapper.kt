package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.infrastructure.persistence.models.ExposedUserTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVeterinarianTable
import org.jetbrains.exposed.v1.core.ResultRow
import java.util.UUID

fun ResultRow.toVeterinarian(specializationIds: List<UUID>): Veterinarian {
    val primaryId = this[ExposedVeterinarianTable.specializationId].value
    return Veterinarian(
        id = this[ExposedVeterinarianTable.id].value,
        userId = this[ExposedVeterinarianTable.userId].value,
        specializationId = primaryId,
        bio = this[ExposedVeterinarianTable.bio],
        photoKey = this[ExposedVeterinarianTable.photoKey],
        experienceYears = this[ExposedVeterinarianTable.experienceYears],
        isActive = this[ExposedVeterinarianTable.isActive],
        createdAt = this[ExposedVeterinarianTable.createdAt].toInstant(),
        updatedAt = this[ExposedVeterinarianTable.updatedAt].toInstant(),
        specializationIds = listOf(primaryId) + specializationIds.filterNot { it == primaryId }.sorted(),
    )
}

fun ResultRow.toVeterinarianDetailsDto(specializationIds: List<UUID>): VeterinarianDetailsDto = VeterinarianDetailsDto(
    veterinarian = toVeterinarian(specializationIds),
    firstName = this[ExposedUserTable.firstName],
    middleName = this[ExposedUserTable.middleName],
    lastName = this[ExposedUserTable.lastName],
    fullName = this[ExposedUserTable.fullName],
)
