package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.entities.VeterinarianSpeciesPermission
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toVeterinarianSpeciesPermission
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVeterinarianSpeciesPermissionTable
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertReturning
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Transactional
class ExposedVeterinarianSpeciesPermissionRepository : VeterinarianSpeciesPermissionRepository {

    override fun create(permission: VeterinarianSpeciesPermission): VeterinarianSpeciesPermission = exposedSql {
        ExposedVeterinarianSpeciesPermissionTable.insertReturning {
            it[veterinarianId] = permission.veterinarianId
            it[speciesId] = permission.speciesId
        }.single().toVeterinarianSpeciesPermission()
    }

    override fun exists(veterinarianId: UUID, speciesId: UUID): Boolean = exposedSql {
        !ExposedVeterinarianSpeciesPermissionTable.selectAll()
            .where(byKey(veterinarianId, speciesId))
            .empty()
    }

    override fun findAllByVeterinarianId(veterinarianId: UUID): List<VeterinarianSpeciesPermission> = exposedSql {
        ExposedVeterinarianSpeciesPermissionTable.selectAll()
            .where { ExposedVeterinarianSpeciesPermissionTable.veterinarianId eq veterinarianId }
            .map { it.toVeterinarianSpeciesPermission() }
    }

    override fun delete(veterinarianId: UUID, speciesId: UUID): Boolean = exposedSql {
        ExposedVeterinarianSpeciesPermissionTable.deleteWhere { byKey(veterinarianId, speciesId) } > 0
    }

    private fun byKey(veterinarianId: UUID, speciesId: UUID): Op<Boolean> =
        (ExposedVeterinarianSpeciesPermissionTable.veterinarianId eq veterinarianId) and
            (ExposedVeterinarianSpeciesPermissionTable.speciesId eq speciesId)
}
