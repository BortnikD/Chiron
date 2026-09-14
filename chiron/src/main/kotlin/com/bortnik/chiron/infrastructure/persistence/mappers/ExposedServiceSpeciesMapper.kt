package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.infrastructure.persistence.models.ExposedServiceSpeciesTable
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toServiceSpecies(): ServiceSpecies = ServiceSpecies(
    serviceId = this[ExposedServiceSpeciesTable.serviceId].value,
    speciesId = this[ExposedServiceSpeciesTable.speciesId].value,
    durationMin = this[ExposedServiceSpeciesTable.durationMin],
    price = this[ExposedServiceSpeciesTable.price]?.toDouble(),
)
