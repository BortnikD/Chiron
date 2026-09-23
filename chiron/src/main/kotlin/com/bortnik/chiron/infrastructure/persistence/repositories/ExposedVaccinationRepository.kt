package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.ifPresent
import com.bortnik.chiron.domain.dto.vaccination.CreateVaccinationDto
import com.bortnik.chiron.domain.dto.vaccination.UpdateVaccinationDto
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toVaccination
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVaccinationTable
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertReturning
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
}
