package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.Species
import com.bortnik.chiron.infrastructure.persistence.models.ExposedSpeciesTable
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toSpecies(): Species = Species(
    id = this[ExposedSpeciesTable.id].value,
    name = this[ExposedSpeciesTable.name],
)
