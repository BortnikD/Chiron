package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.ifPresent
import com.bortnik.chiron.domain.dto.veterinarian.CreateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toVeterinarian
import com.bortnik.chiron.infrastructure.persistence.mappers.toVeterinarianDetailsDto
import com.bortnik.chiron.infrastructure.persistence.models.ExposedUserTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVeterinarianSpecializationTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVeterinarianSpeciesPermissionTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVeterinarianTable
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.andIfNotNull
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inSubQuery
import org.jetbrains.exposed.v1.javatime.CurrentTimestampWithTimeZone
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertIgnore
import org.jetbrains.exposed.v1.jdbc.insertReturning
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Transactional
class ExposedVeterinarianRepository : VeterinarianRepository {

    override fun create(dto: CreateVeterinarianDto): Veterinarian = exposedSql {
        val row = ExposedVeterinarianTable.insertReturning {
            it[userId] = dto.userId
            it[specializationId] = dto.specializationId ?: dto.specializationIds.first()
            it[bio] = dto.bio
            it[experienceYears] = dto.experienceYears
            it[isActive] = dto.isActive
        }.single()
        insertSpecializations(row[ExposedVeterinarianTable.id].value, dto.specializationIds)
        row.toVeterinarian(dto.specializationIds)
    }

    override fun findById(id: UUID): Veterinarian? = exposedSql {
        selectVeterinarians().where { ExposedVeterinarianTable.id eq id }
            .mapWithSpecializations(ResultRow::toVeterinarian).singleOrNull()
    }

    override fun findByUserId(userId: UUID): Veterinarian? = exposedSql {
        selectVeterinarians().where { ExposedVeterinarianTable.userId eq userId }
            .mapWithSpecializations(ResultRow::toVeterinarian).singleOrNull()
    }

    override fun findAll(filter: VeterinarianFilter): List<Veterinarian> = exposedSql {
        selectVeterinarians().where { filter.toCondition() }
            .orderBy(ExposedVeterinarianTable.createdAt to SortOrder.ASC, ExposedVeterinarianTable.id to SortOrder.ASC)
            .mapWithSpecializations(ResultRow::toVeterinarian)
    }

    override fun findDetailsById(id: UUID): VeterinarianDetailsDto? = exposedSql {
        selectWithUser().where { ExposedVeterinarianTable.id eq id }
            .mapWithSpecializations(ResultRow::toVeterinarianDetailsDto).singleOrNull()
    }

    override fun findDetailsByUserId(userId: UUID): VeterinarianDetailsDto? = exposedSql {
        selectWithUser().where { ExposedVeterinarianTable.userId eq userId }
            .mapWithSpecializations(ResultRow::toVeterinarianDetailsDto).singleOrNull()
    }

    override fun findAllDetails(filter: VeterinarianFilter): List<VeterinarianDetailsDto> = exposedSql {
        selectWithUser().where { filter.toCondition() }
            .orderBy(ExposedVeterinarianTable.createdAt to SortOrder.ASC, ExposedVeterinarianTable.id to SortOrder.ASC)
            .mapWithSpecializations(ResultRow::toVeterinarianDetailsDto)
    }

    override fun update(id: UUID, dto: UpdateVeterinarianDto): Veterinarian? = exposedSql {
        // An empty patch has nothing to write, so updatedAt is left untouched.
        if (dto == UpdateVeterinarianDto()) return@exposedSql findById(id)
        val ids = dto.specializationIds
        val oldPrimary = if (ids != null || dto.specializationId != null) {
            ExposedVeterinarianTable.select(ExposedVeterinarianTable.specializationId)
                .where { ExposedVeterinarianTable.id eq id }.forUpdate().singleOrNull()
                ?.get(ExposedVeterinarianTable.specializationId)?.value ?: return@exposedSql null
        } else null
        val primary = dto.specializationId ?: ids?.let { if (oldPrimary in it) oldPrimary else it.first() }

        val updated = ExposedVeterinarianTable.update(where = { ExposedVeterinarianTable.id eq id }) {
            primary?.let { value -> it[specializationId] = value }
            dto.bio.ifPresent { value -> it[bio] = value }
            dto.experienceYears?.let { value -> it[experienceYears] = value }
            dto.isActive?.let { value -> it[isActive] = value }
            it[updatedAt] = CurrentTimestampWithTimeZone
        }
        if (updated == 0) return@exposedSql null

        if (ids != null) {
            ExposedVeterinarianSpecializationTable.deleteWhere { veterinarianId eq id }
            insertSpecializations(id, ids)
        } else if (primary != null && oldPrimary != null && primary != oldPrimary) {
            ExposedVeterinarianSpecializationTable.deleteWhere {
                (veterinarianId eq id) and (specializationId eq oldPrimary)
            }
            ExposedVeterinarianSpecializationTable.insertIgnore {
                it[veterinarianId] = id
                it[specializationId] = primary
            }
        }
        findById(id)
    }

    private fun insertSpecializations(id: UUID, ids: List<UUID>) {
        ExposedVeterinarianSpecializationTable.batchInsert(ids, shouldReturnGeneratedValues = false) { specialization ->
            this[ExposedVeterinarianSpecializationTable.veterinarianId] = id
            this[ExposedVeterinarianSpecializationTable.specializationId] = specialization
        }
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedVeterinarianTable.deleteWhere { ExposedVeterinarianTable.id eq id } > 0
    }

    private val veterinarianWithSpecializations
        get() = ExposedVeterinarianTable innerJoin ExposedVeterinarianSpecializationTable

    private fun selectVeterinarians() = veterinarianWithSpecializations.select(
        ExposedVeterinarianTable.columns + ExposedVeterinarianSpecializationTable.specializationId,
    )

    private fun selectWithUser() = (veterinarianWithSpecializations innerJoin ExposedUserTable).select(
        ExposedVeterinarianTable.columns + listOf(
            ExposedVeterinarianSpecializationTable.specializationId,
            ExposedUserTable.firstName,
            ExposedUserTable.middleName,
            ExposedUserTable.lastName,
            ExposedUserTable.fullName,
        ),
    )

    private fun <T> Iterable<ResultRow>.mapWithSpecializations(mapRow: (ResultRow, List<UUID>) -> T): List<T> =
        groupBy { it[ExposedVeterinarianTable.id] }.values.map { rows ->
            mapRow(rows.first(), rows.map { it[ExposedVeterinarianSpecializationTable.specializationId].value })
        }

    private fun VeterinarianFilter.toCondition(): Op<Boolean> = Op.TRUE.andIfNotNull(
            specializationId?.let { id ->
                ExposedVeterinarianTable.id inSubQuery ExposedVeterinarianSpecializationTable.select(
                    ExposedVeterinarianSpecializationTable.veterinarianId
                ).where { ExposedVeterinarianSpecializationTable.specializationId eq id }
            },
        ).andIfNotNull(
            speciesId?.let {
                ExposedVeterinarianTable.id inSubQuery ExposedVeterinarianSpeciesPermissionTable.select(
                    ExposedVeterinarianSpeciesPermissionTable.veterinarianId,
                ).where { ExposedVeterinarianSpeciesPermissionTable.speciesId eq it }
            },
        ).andIfNotNull(isActive?.let { ExposedVeterinarianTable.isActive eq it })
}
