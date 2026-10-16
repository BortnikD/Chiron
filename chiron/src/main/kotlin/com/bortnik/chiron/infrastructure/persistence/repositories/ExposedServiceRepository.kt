package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.service.CreateServiceDto
import com.bortnik.chiron.domain.dto.service.ServiceFilter
import com.bortnik.chiron.domain.dto.service.UpdateServiceDto
import com.bortnik.chiron.domain.entities.Service
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbDecimal
import com.bortnik.chiron.infrastructure.persistence.mappers.toService
import com.bortnik.chiron.infrastructure.persistence.models.ExposedServiceSpeciesTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedServiceTable
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.andIfNotNull
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inSubQuery
import org.jetbrains.exposed.v1.javatime.CurrentTimestampWithTimeZone
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

    override fun findAll(filter: ServiceFilter): List<Service> = exposedSql {
        ExposedServiceTable.selectAll()
            .where { filter.toCondition() }
            .orderBy(ExposedServiceTable.name to SortOrder.ASC, ExposedServiceTable.id to SortOrder.ASC)
            .map { it.toService() }
    }

    override fun update(id: UUID, dto: UpdateServiceDto): Service? = exposedSql {
        // An empty patch has nothing to write, so updatedAt is left untouched.
        if (dto == UpdateServiceDto()) return@exposedSql findById(id)
        ExposedServiceTable.updateReturning(where = { ExposedServiceTable.id eq id }) {
            dto.specializationId?.let { value -> it[specializationId] = value }
            dto.name?.let { value -> it[name] = value }
            dto.description?.let { value -> it[description] = value }
            dto.basePrice?.let { value -> it[basePrice] = value.toDbDecimal() }
            dto.baseDurationMin?.let { value -> it[baseDurationMin] = value }
            dto.bufferAfterMin?.let { value -> it[bufferAfterMin] = value }
            dto.isActive?.let { value -> it[isActive] = value }
            it[updatedAt] = CurrentTimestampWithTimeZone
        }.singleOrNull()?.toService()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedServiceTable.deleteWhere { ExposedServiceTable.id eq id } > 0
    }

    private fun ServiceFilter.toCondition(): Op<Boolean> = Op.TRUE
        .andIfNotNull(specializationId?.let { ExposedServiceTable.specializationId eq it })
        .andIfNotNull(
            speciesId?.let {
                ExposedServiceTable.id inSubQuery
                    ExposedServiceSpeciesTable.select(ExposedServiceSpeciesTable.serviceId)
                        .where { ExposedServiceSpeciesTable.speciesId eq it }
            },
        )
        .andIfNotNull(isActive?.let { ExposedServiceTable.isActive eq it })
}
