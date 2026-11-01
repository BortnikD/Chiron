package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.client.ClientAppointmentTotalsDto
import com.bortnik.chiron.domain.dto.client.ClientVaccinationTotalsDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.repositories.ClientSummaryRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toAppointment
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbTimestamp
import com.bortnik.chiron.infrastructure.persistence.models.ExposedAppointmentTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedPetTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVaccinationTable
import com.bortnik.chiron.infrastructure.persistence.utils.withoutNewerVaccination
import org.jetbrains.exposed.v1.core.Case
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.count
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.inSubQuery
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.core.longLiteral
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.core.sum
import org.jetbrains.exposed.v1.jdbc.andWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Repository
@Transactional(readOnly = true)
class ExposedClientSummaryRepository : ClientSummaryRepository {

    override fun countActivePets(ownerId: UUID): Long = exposedSql {
        ExposedPetTable.selectAll()
            .where { (ExposedPetTable.ownerId eq ownerId) and (ExposedPetTable.isArchived eq false) }
            .count()
    }

    override fun countAppointments(ownerId: UUID, now: Instant): ClientAppointmentTotalsDto = exposedSql {
        val count = ExposedAppointmentTable.id.count()
        val rows = ExposedAppointmentTable.select(ExposedAppointmentTable.status, count)
            .where {
                (ExposedAppointmentTable.petId inSubQuery ownPets(ownerId)) and
                        ((ExposedAppointmentTable.status eq AppointmentStatus.COMPLETED) or upcoming(now))
            }
            .groupBy(ExposedAppointmentTable.status)
            .associate { it[ExposedAppointmentTable.status] to it[count] }
        ClientAppointmentTotalsDto(
            upcoming = (rows[AppointmentStatus.PENDING] ?: 0) + (rows[AppointmentStatus.CONFIRMED] ?: 0),
            completed = rows[AppointmentStatus.COMPLETED] ?: 0,
        )
    }

    override fun findNextAppointment(ownerId: UUID, now: Instant): Appointment? = exposedSql {
        ExposedAppointmentTable.selectAll()
            .where { (ExposedAppointmentTable.petId inSubQuery ownPets(ownerId)) and upcoming(now) }
            .orderBy(ExposedAppointmentTable.startAt to SortOrder.ASC, ExposedAppointmentTable.id to SortOrder.ASC)
            .limit(1)
            .singleOrNull()
            ?.toAppointment()
    }

    override fun countVaccinations(
        ownerId: UUID,
        today: LocalDate,
        dueTo: LocalDate,
    ): ClientVaccinationTotalsDto = exposedSql {
        val activePets = ownPets(ownerId).andWhere { ExposedPetTable.isArchived eq false }
        val count = ExposedVaccinationTable.id.count()
        val overdue = Case().When(ExposedVaccinationTable.nextDueOn less today, longLiteral(1))
            .Else(longLiteral(0)).sum()
        val row = ExposedVaccinationTable.select(count, overdue)
            .where {
                (ExposedVaccinationTable.petId inSubQuery activePets) and
                        (ExposedVaccinationTable.nextDueOn lessEq dueTo) and withoutNewerVaccination()
            }
            .single()
        ClientVaccinationTotalsDto(due = row[count], overdue = row[overdue] ?: 0)
    }

    private fun ownPets(ownerId: UUID) = ExposedPetTable.select(ExposedPetTable.id)
        .where { ExposedPetTable.ownerId eq ownerId }

    private fun upcoming(now: Instant) =
        (ExposedAppointmentTable.status inList listOf(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED)) and
                (ExposedAppointmentTable.startAt greaterEq now.toDbTimestamp())
}
