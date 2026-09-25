package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.ifPresent
import com.bortnik.chiron.domain.dto.veterinarian.CreateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toVeterinarian
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVeterinarianSpeciesPermissionTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVeterinarianTable
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
class ExposedVeterinarianRepository : VeterinarianRepository {

    override fun create(dto: CreateVeterinarianDto): Veterinarian = exposedSql {
        ExposedVeterinarianTable.insertReturning {
            it[userId] = dto.userId
            it[specializationId] = dto.specializationId
            it[bio] = dto.bio
            it[photoUrl] = dto.photoUrl
            it[experienceYears] = dto.experienceYears
            it[isActive] = dto.isActive
        }.single().toVeterinarian()
    }

    override fun findById(id: UUID): Veterinarian? = exposedSql {
        ExposedVeterinarianTable.selectAll()
            .where { ExposedVeterinarianTable.id eq id }
            .singleOrNull()
            ?.toVeterinarian()
    }

    override fun findByUserId(userId: UUID): Veterinarian? = exposedSql {
        ExposedVeterinarianTable.selectAll()
            .where { ExposedVeterinarianTable.userId eq userId }
            .singleOrNull()
            ?.toVeterinarian()
    }

    override fun findAll(filter: VeterinarianFilter): List<Veterinarian> = exposedSql {
        ExposedVeterinarianTable.selectAll()
            .where { filter.toCondition() }
            .orderBy(ExposedVeterinarianTable.createdAt to SortOrder.ASC, ExposedVeterinarianTable.id to SortOrder.ASC)
            .map { it.toVeterinarian() }
    }

    override fun update(id: UUID, dto: UpdateVeterinarianDto): Veterinarian? = exposedSql {
        // An empty patch has nothing to write, so updatedAt is left untouched.
        if (dto == UpdateVeterinarianDto()) return@exposedSql findById(id)
        ExposedVeterinarianTable.updateReturning(where = { ExposedVeterinarianTable.id eq id }) {
            dto.specializationId?.let { value -> it[specializationId] = value }
            dto.bio.ifPresent { value -> it[bio] = value }
            dto.photoUrl.ifPresent { value -> it[photoUrl] = value }
            dto.experienceYears?.let { value -> it[experienceYears] = value }
            dto.isActive?.let { value -> it[isActive] = value }
            it[updatedAt] = CurrentTimestampWithTimeZone
        }.singleOrNull()?.toVeterinarian()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedVeterinarianTable.deleteWhere { ExposedVeterinarianTable.id eq id } > 0
    }

    private fun VeterinarianFilter.toCondition(): Op<Boolean> = Op.TRUE
        .andIfNotNull(specializationId?.let { ExposedVeterinarianTable.specializationId eq it })
        .andIfNotNull(
            speciesId?.let {
                ExposedVeterinarianTable.id inSubQuery
                    ExposedVeterinarianSpeciesPermissionTable.select(
                        ExposedVeterinarianSpeciesPermissionTable.veterinarianId,
                    ).where { ExposedVeterinarianSpeciesPermissionTable.speciesId eq it }
            },
        )
        .andIfNotNull(isActive?.let { ExposedVeterinarianTable.isActive eq it })
}
