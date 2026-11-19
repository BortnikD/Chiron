package com.bortnik.chiron.infrastructure.persistence.models

import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

object ExposedVeterinarianSpecializationTable : Table("veterinarian_specialization") {
    val veterinarianId = reference("veterinarian_id", ExposedVeterinarianTable, onDelete = ReferenceOption.CASCADE)
    val specializationId = reference("specialization_id", ExposedSpecializationTable)

    override val primaryKey = PrimaryKey(veterinarianId, specializationId)
}
