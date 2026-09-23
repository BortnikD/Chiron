package com.bortnik.chiron.application.usecase.admin.veterinarianspeciespermission

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.entities.VeterinarianSpeciesPermission
import com.bortnik.chiron.domain.exceptions.alreadyexists.VeterinarianSpeciesPermissionAlreadyExistsException
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateVeterinarianSpeciesPermissionUseCase(
    private val permissionRepository: VeterinarianSpeciesPermissionRepository,
) {

    fun create(actor: Actor, permission: VeterinarianSpeciesPermission): VeterinarianSpeciesPermission {
        if (permissionRepository.exists(permission.veterinarianId, permission.speciesId)) {
            throw VeterinarianSpeciesPermissionAlreadyExistsException(permission.veterinarianId, permission.speciesId)
        }
        return permissionRepository.create(permission)
    }
}
