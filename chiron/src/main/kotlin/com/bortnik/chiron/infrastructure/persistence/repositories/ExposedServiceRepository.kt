package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.service.CreateServiceDto
import com.bortnik.chiron.domain.dto.service.UpdateServiceDto
import com.bortnik.chiron.domain.entities.Service
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbDecimal
import com.bortnik.chiron.infrastructure.persistence.mappers.toService
import com.bortnik.chiron.infrastructure.persistence.models.ExposedServiceTable
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.javatime.CurrentTimestampWithTimeZone
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertReturning
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.updateReturning
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Transactional
class ExposedServiceRepository : ServiceRepository {

    override fun create(dto: CreateServiceDto): Service = exposedSql {
        ExposedServiceTable.insertReturning {
            it[specializationId] = dto.specializationId
            it[name] = dto.name
            it[description] = dto.description
            it[basePrice] = dto.basePrice.toDbDecimal()
            it[baseDurationMin] = dto.baseDurationMin
            it[bufferAfterMin] = dto.bufferAfterMin
            it[isActive] = dto.isActive
        }.single().toService()
    }

    override fun findById(id: UUID): Service? = exposedSql {
        ExposedServiceTable.selectAll()
            .where { ExposedServiceTable.id eq id }
            .singleOrNull()
            ?.toService()
    }

    override fun findAllBySpecializationId(specializationId: UUID): List<Service> = exposedSql {
        ExposedServiceTable.selectAll()
            .where { ExposedServiceTable.specializationId eq specializationId }
            .orderBy(ExposedServiceTable.name, SortOrder.ASC)
            .map { it.toService() }
    }

    override fun findAll(): List<Service> = exposedSql {
        ExposedServiceTable.selectAll()
            .orderBy(ExposedServiceTable.name, SortOrder.ASC)
            .map { it.toService() }
    }

    override fun update(id: UUID, dto: UpdateServiceDto): Service? = exposedSql {
        ExposedServiceTable.updateReturning(where = { ExposedServiceTable.id eq id }) {
            it[specializationId] = dto.specializationId
            it[name] = dto.name
            it[description] = dto.description
            it[basePrice] = dto.basePrice.toDbDecimal()
            it[baseDurationMin] = dto.baseDurationMin
            it[bufferAfterMin] = dto.bufferAfterMin
            it[isActive] = dto.isActive
            it[updatedAt] = CurrentTimestampWithTimeZone
        }.singleOrNull()?.toService()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedServiceTable.deleteWhere { ExposedServiceTable.id eq id } > 0
    }
}
