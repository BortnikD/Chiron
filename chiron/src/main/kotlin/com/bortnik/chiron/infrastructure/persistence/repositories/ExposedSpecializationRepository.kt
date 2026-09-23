package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.specialization.CreateSpecializationDto
import com.bortnik.chiron.domain.dto.specialization.UpdateSpecializationDto
import com.bortnik.chiron.domain.entities.Specialization
import com.bortnik.chiron.domain.repositories.SpecializationRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toSpecialization
import com.bortnik.chiron.infrastructure.persistence.models.ExposedSpecializationTable
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
class ExposedSpecializationRepository : SpecializationRepository {

    override fun create(dto: CreateSpecializationDto): Specialization = exposedSql {
        ExposedSpecializationTable.insertReturning {
            it[name] = dto.name
            it[description] = dto.description
        }.single().toSpecialization()
    }

    override fun findById(id: UUID): Specialization? = exposedSql {
        ExposedSpecializationTable.selectAll()
            .where { ExposedSpecializationTable.id eq id }
            .singleOrNull()
            ?.toSpecialization()
    }

    override fun findAll(): List<Specialization> = exposedSql {
        ExposedSpecializationTable.selectAll()
            .orderBy(ExposedSpecializationTable.name, SortOrder.ASC)
            .map { it.toSpecialization() }
    }

    override fun update(id: UUID, dto: UpdateSpecializationDto): Specialization? = exposedSql {
        // Exposed rejects an UPDATE without columns, so an empty patch only reads the row.
        if (dto == UpdateSpecializationDto()) return@exposedSql findById(id)
        ExposedSpecializationTable.updateReturning(where = { ExposedSpecializationTable.id eq id }) {
            dto.name?.let { value -> it[name] = value }
            dto.description?.let { value -> it[description] = value }
        }.singleOrNull()?.toSpecialization()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedSpecializationTable.deleteWhere { ExposedSpecializationTable.id eq id } > 0
    }
}
