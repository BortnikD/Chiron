package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.ifPresent
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.vaccination.CreateVaccinationDto
import com.bortnik.chiron.domain.dto.vaccination.UpdateVaccinationDto
import com.bortnik.chiron.domain.dto.vaccination.VaccinationFilter
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.infrastructure.persistence.containsIgnoreCase
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toVaccination
import com.bortnik.chiron.infrastructure.persistence.models.ExposedAppointmentTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVaccinationTable
import com.bortnik.chiron.infrastructure.persistence.toPage
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.andIfNotNull
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.inSubQuery
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertReturning
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.updateReturning
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Transactional
class ExposedVaccinationRepository : VaccinationRepository {

    override fun create(dto: CreateVaccinationDto): Vaccination = exposedSql {
        ExposedVaccinationTable.insertReturning {
            it[petId] = dto.petId
            it[appointmentId] = dto.appointmentId
            it[name] = dto.name
            it[administeredOn] = dto.administeredOn
            it[nextDueOn] = dto.nextDueOn
        }.single().toVaccination()
    }

    override fun findById(id: UUID): Vaccination? = exposedSql {
        ExposedVaccinationTable.selectAll()
            .where { ExposedVaccinationTable.id eq id }
            .singleOrNull()
            ?.toVaccination()
    }

    override fun findAllByPetId(petId: UUID): List<Vaccination> = exposedSql {
        ExposedVaccinationTable.selectAll()
            .where { ExposedVaccinationTable.petId eq petId }
            .orderBy(ExposedVaccinationTable.administeredOn, SortOrder.DESC)
            .map { it.toVaccination() }
    }

    override fun findAll(filter: VaccinationFilter, pageRequest: PageRequest): Page<Vaccination> = exposedSql {
        ExposedVaccinationTable.selectAll()
            .where { filter.toCondition() }
            .toPage(
                pageRequest,
                ExposedVaccinationTable.administeredOn to SortOrder.DESC,
                ExposedVaccinationTable.id to SortOrder.DESC,
            ) { it.toVaccination() }
    }

    override fun update(id: UUID, dto: UpdateVaccinationDto): Vaccination? = exposedSql {
        // Exposed rejects an UPDATE without columns, so an empty patch only reads the row.
        if (dto == UpdateVaccinationDto()) return@exposedSql findById(id)
        ExposedVaccinationTable.updateReturning(where = { ExposedVaccinationTable.id eq id }) {
            dto.name?.let { value -> it[name] = value }
            dto.administeredOn?.let { value -> it[administeredOn] = value }
            dto.nextDueOn.ifPresent { value -> it[nextDueOn] = value }
        }.singleOrNull()?.toVaccination()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedVaccinationTable.deleteWhere { ExposedVaccinationTable.id eq id } > 0
    }

    private fun VaccinationFilter.toCondition(): Op<Boolean> = Op.TRUE
        .andIfNotNull(petId?.let { ExposedVaccinationTable.petId eq it })
        .andIfNotNull(
            patientOfVeterinarianId?.let {
                ExposedVaccinationTable.petId inSubQuery
                    ExposedAppointmentTable.select(ExposedAppointmentTable.petId)
                        .where { ExposedAppointmentTable.veterinarianId eq it }
            },
        )
        .andIfNotNull(name?.let { ExposedVaccinationTable.name.containsIgnoreCase(it) })
        .andIfNotNull(nextDueFrom?.let { ExposedVaccinationTable.nextDueOn greaterEq it })
        .andIfNotNull(nextDueTo?.let { ExposedVaccinationTable.nextDueOn lessEq it })
}
