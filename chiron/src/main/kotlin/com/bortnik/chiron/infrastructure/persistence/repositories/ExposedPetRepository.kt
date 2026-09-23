package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.ifPresent
import com.bortnik.chiron.domain.dto.pet.CreatePetDto
import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbDecimal
import com.bortnik.chiron.infrastructure.persistence.mappers.toPet
import com.bortnik.chiron.infrastructure.persistence.models.ExposedPetTable
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
class ExposedPetRepository : PetRepository {

    override fun create(dto: CreatePetDto): Pet = exposedSql {
        ExposedPetTable.insertReturning {
            it[name] = dto.name
            it[ownerId] = dto.ownerId
            it[speciesId] = dto.speciesId
            it[birthDate] = dto.birthDate
            it[weightKg] = dto.weightKg?.toDbDecimal()
            it[gender] = dto.gender
            it[notes] = dto.notes
        }.single().toPet()
    }

    override fun findById(id: UUID): Pet? = exposedSql {
        ExposedPetTable.selectAll()
            .where { ExposedPetTable.id eq id }
            .singleOrNull()
            ?.toPet()
    }

    override fun findAllByOwnerId(ownerId: UUID): List<Pet> = exposedSql {
        ExposedPetTable.selectAll()
            .where { ExposedPetTable.ownerId eq ownerId }
            .orderBy(ExposedPetTable.createdAt, SortOrder.ASC)
            .map { it.toPet() }
    }

    override fun findAll(): List<Pet> = exposedSql {
        ExposedPetTable.selectAll()
            .orderBy(ExposedPetTable.createdAt, SortOrder.ASC)
            .map { it.toPet() }
    }

    override fun update(id: UUID, dto: UpdatePetDto): Pet? = exposedSql {
        // An empty patch has nothing to write, so updatedAt is left untouched.
        if (dto == UpdatePetDto()) return@exposedSql findById(id)
        ExposedPetTable.updateReturning(where = { ExposedPetTable.id eq id }) {
            dto.name?.let { value -> it[name] = value }
            dto.speciesId?.let { value -> it[speciesId] = value }
            dto.birthDate.ifPresent { value -> it[birthDate] = value }
            dto.weightKg.ifPresent { value -> it[weightKg] = value?.toDbDecimal() }
            dto.gender?.let { value -> it[gender] = value }
            dto.notes.ifPresent { value -> it[notes] = value }
            dto.isArchived?.let { value -> it[isArchived] = value }
            it[updatedAt] = CurrentTimestampWithTimeZone
        }.singleOrNull()?.toPet()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedPetTable.deleteWhere { ExposedPetTable.id eq id } > 0
    }
}
