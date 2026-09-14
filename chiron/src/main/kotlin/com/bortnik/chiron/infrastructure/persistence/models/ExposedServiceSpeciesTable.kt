package com.bortnik.chiron.infrastructure.persistence.models

import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.DECIMAL_PRECISION
import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.DECIMAL_SCALE
import org.jetbrains.exposed.v1.core.Table

// Composite primary key, so a plain Table is used instead of UUIDTable.
object ExposedServiceSpeciesTable : Table("service_species") {
    val serviceId = reference("service_id", ExposedServiceTable)
    val speciesId = reference("species_id", ExposedSpeciesTable)
    val durationMin = integer("duration_min").nullable()
    val price = decimal("price", DECIMAL_PRECISION, DECIMAL_SCALE).nullable()

    override val primaryKey = PrimaryKey(serviceId, speciesId)
}
