package com.bortnik.chiron.infrastructure.persistence.utils

import com.bortnik.chiron.infrastructure.persistence.models.ExposedVaccinationTable
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.alias
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.core.notExists
import org.jetbrains.exposed.v1.jdbc.select

internal fun withoutNewerVaccination(): Op<Boolean> {
    val newer = ExposedVaccinationTable.alias("newer_vaccination")
    return notExists(newer.select(newer[ExposedVaccinationTable.id]).where {
        (newer[ExposedVaccinationTable.petId] eq ExposedVaccinationTable.petId) and
                (newer[ExposedVaccinationTable.name].lowerCase() eq ExposedVaccinationTable.name.lowerCase()) and
                (newer[ExposedVaccinationTable.administeredOn] greater ExposedVaccinationTable.administeredOn)
    })
}
