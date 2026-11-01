package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.pet.PetNextAppointmentDto
import com.bortnik.chiron.domain.dto.pet.PetSummaryDto
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.repositories.PetSummaryRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbTimestamp
import com.bortnik.chiron.infrastructure.persistence.models.ExposedAppointmentTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedPetTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVaccinationTable
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.alias
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.count
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.inSubQuery
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.core.min
import org.jetbrains.exposed.v1.core.notExists
import org.jetbrains.exposed.v1.jdbc.select
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Repository
@Transactional(readOnly = true)
class ExposedPetSummaryRepository : PetSummaryRepository {

    override fun findAll(ownerId: UUID, petIds: List<UUID>, now: Instant): Map<UUID, PetSummaryDto> = exposedSql {
        val ownedPets = ExposedPetTable.select(ExposedPetTable.id)
            .where { (ExposedPetTable.ownerId eq ownerId) and (ExposedPetTable.id inList petIds) }
        val appointmentCount = ExposedAppointmentTable.id.count()
        val counts = ExposedAppointmentTable
            .select(ExposedAppointmentTable.petId, ExposedAppointmentTable.status, appointmentCount)
            .where { ExposedAppointmentTable.petId inSubQuery ownedPets }
            .groupBy(ExposedAppointmentTable.petId, ExposedAppointmentTable.status)
            .groupBy { it[ExposedAppointmentTable.petId].value }
        val nextAppointments = ExposedAppointmentTable
            .select(
                ExposedAppointmentTable.petId,
                ExposedAppointmentTable.id,
                ExposedAppointmentTable.startAt,
                ExposedAppointmentTable.serviceId,
            )
            .where {
                (ExposedAppointmentTable.petId inSubQuery ownedPets) and
                        (ExposedAppointmentTable.status inList listOf(
                            AppointmentStatus.PENDING,
                            AppointmentStatus.CONFIRMED
                        )) and
                        (ExposedAppointmentTable.startAt greaterEq now.toDbTimestamp())
            }
            .withDistinctOn(ExposedAppointmentTable.petId to SortOrder.ASC)
            .orderBy(ExposedAppointmentTable.startAt to SortOrder.ASC, ExposedAppointmentTable.id to SortOrder.ASC)
            .associate {
                it[ExposedAppointmentTable.petId].value to PetNextAppointmentDto(
                    id = it[ExposedAppointmentTable.id].value,
                    startAt = it[ExposedAppointmentTable.startAt].toInstant(),
                    serviceId = it[ExposedAppointmentTable.serviceId].value,
                )
            }
        val vaccinationCount = ExposedVaccinationTable.id.count()
        val vaccinationCounts = ExposedVaccinationTable
            .select(ExposedVaccinationTable.petId, vaccinationCount)
            .where { ExposedVaccinationTable.petId inSubQuery ownedPets }
            .groupBy(ExposedVaccinationTable.petId)
            .associate { it[ExposedVaccinationTable.petId].value to it[vaccinationCount] }
        val newer = ExposedVaccinationTable.alias("newer_vaccination")
        val newerVaccination = newer.select(newer[ExposedVaccinationTable.id]).where {
            (newer[ExposedVaccinationTable.petId] eq ExposedVaccinationTable.petId) and
                    (newer[ExposedVaccinationTable.name].lowerCase() eq ExposedVaccinationTable.name.lowerCase()) and
                    (newer[ExposedVaccinationTable.administeredOn] greater ExposedVaccinationTable.administeredOn)
        }
        val nextDueOn = ExposedVaccinationTable.nextDueOn.min()
        val dueDates = ExposedVaccinationTable
            .select(ExposedVaccinationTable.petId, nextDueOn)
            .where { (ExposedVaccinationTable.petId inSubQuery ownedPets) and notExists(newerVaccination) }
            .groupBy(ExposedVaccinationTable.petId)
            .associate { it[ExposedVaccinationTable.petId].value to it[nextDueOn] }
        (counts.keys + vaccinationCounts.keys).associateWith { petId ->
            val petCounts = counts[petId].orEmpty()
            PetSummaryDto(
                completedVisits = petCounts
                    .filter { it[ExposedAppointmentTable.status] == AppointmentStatus.COMPLETED }
                    .sumOf { it[appointmentCount] },
                appointmentsCount = petCounts.sumOf { it[appointmentCount] },
                vaccinationsCount = vaccinationCounts[petId] ?: 0,
                nextAppointment = nextAppointments[petId],
                nextVaccinationDueOn = dueDates[petId],
            )
        }
    }
}
