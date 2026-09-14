package com.bortnik.chiron.infrastructure.persistence.models

import com.bortnik.chiron.domain.entities.enums.Gender
import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.DECIMAL_PRECISION
import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.DECIMAL_SCALE
import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.ENUM_LENGTH
import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import org.jetbrains.exposed.v1.javatime.date
import org.jetbrains.exposed.v1.javatime.timestampWithTimeZone

object ExposedPetTable : UUIDTable("pet") {
    val name = text("name")
    val ownerId = reference("owner_id", ExposedUserTable)
    val speciesId = reference("species_id", ExposedSpeciesTable)
    val birthDate = date("birth_date").nullable()
    val weightKg = decimal("weight_kg", DECIMAL_PRECISION, DECIMAL_SCALE).nullable()
    val gender = enumerationByName<Gender>("gender", ENUM_LENGTH)
    val notes = text("notes").nullable()
    val isArchived = bool("is_archived")
    val createdAt = timestampWithTimeZone("created_at")
    val updatedAt = timestampWithTimeZone("updated_at")
}
