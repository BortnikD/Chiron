package com.bortnik.chiron.application.usecase.veterinarianspeciespermission

import com.bortnik.chiron.domain.entities.VeterinarianSpeciesPermission
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetVeterinarianSpeciesPermissionUseCase(
    private val permissionRepository: VeterinarianSpeciesPermissionRepository,
) {

    fun exists(veterinarianId: UUID, speciesId: UUID): Boolean =
        permissionRepository.exists(veterinarianId, speciesId)

    fun findAllByVeterinarianId(veterinarianId: UUID): List<VeterinarianSpeciesPermission> =
        permissionRepository.findAllByVeterinarianId(veterinarianId)
}
