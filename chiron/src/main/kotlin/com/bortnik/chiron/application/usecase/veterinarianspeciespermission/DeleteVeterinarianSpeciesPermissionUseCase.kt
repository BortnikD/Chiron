package com.bortnik.chiron.application.usecase.veterinarianspeciespermission

import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianSpeciesPermissionNotFoundException
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class DeleteVeterinarianSpeciesPermissionUseCase(
    private val permissionRepository: VeterinarianSpeciesPermissionRepository,
) {

    fun delete(veterinarianId: UUID, speciesId: UUID) {
        if (!permissionRepository.delete(veterinarianId, speciesId)) {
            throw VeterinarianSpeciesPermissionNotFoundException(veterinarianId, speciesId)
        }
    }
}
