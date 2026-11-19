package com.bortnik.chiron.application.usecase.admin.veterinarianspeciespermission

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.entities.VeterinarianSpeciesPermission
import com.bortnik.chiron.domain.exceptions.alreadyexists.VeterinarianSpeciesPermissionAlreadyExistsException
import com.bortnik.chiron.domain.exceptions.notfound.SpeciesNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateVeterinarianSpeciesPermissionUseCase(
    private val permissionRepository: VeterinarianSpeciesPermissionRepository,
    private val veterinarianRepository: VeterinarianRepository,
    private val speciesRepository: SpeciesRepository,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun create(actor: Actor, permission: VeterinarianSpeciesPermission): VeterinarianSpeciesPermission {
        if (permissionRepository.exists(permission.veterinarianId, permission.speciesId)) {
            throw VeterinarianSpeciesPermissionAlreadyExistsException(permission.veterinarianId, permission.speciesId)
        }
        veterinarianRepository.findById(permission.veterinarianId)
            ?: throw VeterinarianNotFoundException(permission.veterinarianId)
        speciesRepository.findById(permission.speciesId) ?: throw SpeciesNotFoundException(permission.speciesId)
        val created = permissionRepository.create(permission)
        log.info(
            "Admin {} ({}) allowed veterinarian {} to treat species {}",
            actor.userId,
            actor.fullName,
            created.veterinarianId,
            created.speciesId,
        )
        return created
    }
}
