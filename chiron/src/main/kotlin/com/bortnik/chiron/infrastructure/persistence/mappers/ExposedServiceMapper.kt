package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.Service
import com.bortnik.chiron.infrastructure.persistence.models.ExposedServiceTable
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toService(): Service = Service(
    id = this[ExposedServiceTable.id].value,
    specializationId = this[ExposedServiceTable.specializationId].value,
    name = this[ExposedServiceTable.name],
    description = this[ExposedServiceTable.description],
    basePrice = this[ExposedServiceTable.basePrice].toDouble(),
    baseDurationMin = this[ExposedServiceTable.baseDurationMin],
    bufferAfterMin = this[ExposedServiceTable.bufferAfterMin],
    isActive = this[ExposedServiceTable.isActive],
    createdAt = this[ExposedServiceTable.createdAt].toInstant(),
    updatedAt = this[ExposedServiceTable.updatedAt].toInstant(),
)
