package com.bortnik.chiron.application.usecase.admin.veterinarianspeciespermission

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianSpeciesPermissionNotFoundException
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteVeterinarianSpeciesPermissionUseCase(
    private val permissionRepository: VeterinarianSpeciesPermissionRepository,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, veterinarianId: UUID, speciesId: UUID) {
        if (!permissionRepository.delete(veterinarianId, speciesId)) {
            throw VeterinarianSpeciesPermissionNotFoundException(veterinarianId, speciesId)
        }
        log.info(
            "Admin {} ({}) revoked permission of veterinarian {} to treat species {}",
            actor.userId,
            actor.fullName,
            veterinarianId,
            speciesId,
        )
    }
}
