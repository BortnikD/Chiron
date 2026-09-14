package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.Specialization
import com.bortnik.chiron.infrastructure.persistence.models.ExposedSpecializationTable
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toSpecialization(): Specialization = Specialization(
    id = this[ExposedSpecializationTable.id].value,
    name = this[ExposedSpecializationTable.name],
    description = this[ExposedSpecializationTable.description],
)
