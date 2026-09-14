package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.veterinarian.CreateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toVeterinarian
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVeterinarianTable
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

    override fun findAll(): List<Veterinarian> = exposedSql {
        ExposedVeterinarianTable.selectAll()
            .orderBy(ExposedVeterinarianTable.createdAt, SortOrder.ASC)
            .map { it.toVeterinarian() }
    }

    override fun update(id: UUID, dto: UpdateVeterinarianDto): Veterinarian? = exposedSql {
        ExposedVeterinarianTable.updateReturning(where = { ExposedVeterinarianTable.id eq id }) {
            it[specializationId] = dto.specializationId
            it[bio] = dto.bio
            it[photoUrl] = dto.photoUrl
            it[experienceYears] = dto.experienceYears
            it[isActive] = dto.isActive
            it[updatedAt] = CurrentTimestampWithTimeZone
        }.singleOrNull()?.toVeterinarian()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedVeterinarianTable.deleteWhere { ExposedVeterinarianTable.id eq id } > 0
    }
}
