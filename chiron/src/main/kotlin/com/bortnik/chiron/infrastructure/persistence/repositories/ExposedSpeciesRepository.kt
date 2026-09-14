package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.species.CreateSpeciesDto
import com.bortnik.chiron.domain.dto.species.UpdateSpeciesDto
import com.bortnik.chiron.domain.entities.Species
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toSpecies
import com.bortnik.chiron.infrastructure.persistence.models.ExposedSpeciesTable
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
class ExposedSpeciesRepository : SpeciesRepository {

    override fun create(dto: CreateSpeciesDto): Species = exposedSql {
        ExposedSpeciesTable.insertReturning {
            it[name] = dto.name
        }.single().toSpecies()
    }

    override fun findById(id: UUID): Species? = exposedSql {
        ExposedSpeciesTable.selectAll()
            .where { ExposedSpeciesTable.id eq id }
            .singleOrNull()
            ?.toSpecies()
    }

    override fun findByName(name: String): Species? = exposedSql {
        ExposedSpeciesTable.selectAll()
            .where { ExposedSpeciesTable.name eq name }
            .singleOrNull()
            ?.toSpecies()
    }

    override fun findAll(): List<Species> = exposedSql {
        ExposedSpeciesTable.selectAll()
            .orderBy(ExposedSpeciesTable.name, SortOrder.ASC)
            .map { it.toSpecies() }
    }

    override fun update(id: UUID, dto: UpdateSpeciesDto): Species? = exposedSql {
        ExposedSpeciesTable.updateReturning(where = { ExposedSpeciesTable.id eq id }) {
            it[name] = dto.name
        }.singleOrNull()?.toSpecies()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedSpeciesTable.deleteWhere { ExposedSpeciesTable.id eq id } > 0
    }
}
