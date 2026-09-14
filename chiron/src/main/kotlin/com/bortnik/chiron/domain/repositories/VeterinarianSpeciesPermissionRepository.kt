package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.entities.VeterinarianSpeciesPermission
import java.util.UUID

interface VeterinarianSpeciesPermissionRepository {
    fun create(permission: VeterinarianSpeciesPermission): VeterinarianSpeciesPermission

    fun exists(veterinarianId: UUID, speciesId: UUID): Boolean

    fun findAllByVeterinarianId(veterinarianId: UUID): List<VeterinarianSpeciesPermission>

    fun delete(veterinarianId: UUID, speciesId: UUID): Boolean
}
