package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.VeterinarianSpeciesPermission
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVeterinarianSpeciesPermissionTable
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toVeterinarianSpeciesPermission(): VeterinarianSpeciesPermission = VeterinarianSpeciesPermission(
    veterinarianId = this[ExposedVeterinarianSpeciesPermissionTable.veterinarianId].value,
    speciesId = this[ExposedVeterinarianSpeciesPermissionTable.speciesId].value,
)
