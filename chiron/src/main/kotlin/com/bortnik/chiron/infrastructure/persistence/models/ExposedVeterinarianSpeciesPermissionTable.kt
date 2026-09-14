package com.bortnik.chiron.infrastructure.persistence.models

import org.jetbrains.exposed.v1.core.Table

// Composite primary key, so a plain Table is used instead of UUIDTable.
object ExposedVeterinarianSpeciesPermissionTable : Table("veterinarian_species_permission") {
    val veterinarianId = reference("veterinarian_id", ExposedVeterinarianTable)
    val speciesId = reference("species_id", ExposedSpeciesTable)

    override val primaryKey = PrimaryKey(veterinarianId, speciesId)
}
