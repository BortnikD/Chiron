package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.servicespecies.UpdateServiceSpeciesDto
import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbDecimal
import com.bortnik.chiron.infrastructure.persistence.mappers.toServiceSpecies
import com.bortnik.chiron.infrastructure.persistence.models.ExposedServiceSpeciesTable
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.and
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
class ExposedServiceSpeciesRepository : ServiceSpeciesRepository {

    override fun create(serviceSpecies: ServiceSpecies): ServiceSpecies = exposedSql {
        ExposedServiceSpeciesTable.insertReturning {
            it[serviceId] = serviceSpecies.serviceId
            it[speciesId] = serviceSpecies.speciesId
            it[durationMin] = serviceSpecies.durationMin
            it[price] = serviceSpecies.price?.toDbDecimal()
        }.single().toServiceSpecies()
    }

    override fun findById(serviceId: UUID, speciesId: UUID): ServiceSpecies? = exposedSql {
        ExposedServiceSpeciesTable.selectAll()
            .where(byKey(serviceId, speciesId))
            .singleOrNull()
            ?.toServiceSpecies()
    }

    override fun findAllByServiceId(serviceId: UUID): List<ServiceSpecies> = exposedSql {
        ExposedServiceSpeciesTable.selectAll()
            .where { ExposedServiceSpeciesTable.serviceId eq serviceId }
            .map { it.toServiceSpecies() }
    }

    override fun update(serviceId: UUID, speciesId: UUID, dto: UpdateServiceSpeciesDto): ServiceSpecies? = exposedSql {
        ExposedServiceSpeciesTable.updateReturning(where = { byKey(serviceId, speciesId) }) {
            it[durationMin] = dto.durationMin
            it[price] = dto.price?.toDbDecimal()
        }.singleOrNull()?.toServiceSpecies()
    }

    override fun deleteById(serviceId: UUID, speciesId: UUID): Boolean = exposedSql {
        ExposedServiceSpeciesTable.deleteWhere { byKey(serviceId, speciesId) } > 0
    }

    private fun byKey(serviceId: UUID, speciesId: UUID): Op<Boolean> =
        (ExposedServiceSpeciesTable.serviceId eq serviceId) and (ExposedServiceSpeciesTable.speciesId eq speciesId)
}
