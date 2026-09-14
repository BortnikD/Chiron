package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVaccinationTable
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toVaccination(): Vaccination = Vaccination(
    id = this[ExposedVaccinationTable.id].value,
    petId = this[ExposedVaccinationTable.petId].value,
    appointmentId = this[ExposedVaccinationTable.appointmentId]?.value,
    name = this[ExposedVaccinationTable.name],
    administeredOn = this[ExposedVaccinationTable.administeredOn],
    nextDueOn = this[ExposedVaccinationTable.nextDueOn],
)
