package com.bortnik.chiron.application.usecase.common.veterinarian

import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetVeterinarianUseCase(
    private val veterinarianRepository: VeterinarianRepository,
    private val permissionRepository: VeterinarianSpeciesPermissionRepository,
) {

    fun findById(id: UUID): VeterinarianDetailsDto =
        (veterinarianRepository.findDetailsById(id) ?: throw VeterinarianNotFoundException(id)).withSpecies()

    fun findByUserId(userId: UUID): VeterinarianDetailsDto =
        (veterinarianRepository.findDetailsByUserId(userId)
            ?: throw VeterinarianNotFoundException("userId", userId)).withSpecies()

    fun findAll(filter: VeterinarianFilter): List<VeterinarianDetailsDto> {
        val veterinarians = veterinarianRepository.findAllDetails(filter)
        if (veterinarians.isEmpty()) return veterinarians
        val speciesByVeterinarian = permissionRepository
            .findAllByVeterinarianIds(veterinarians.map { it.veterinarian.id })
            .groupBy({ it.veterinarianId }, { it.speciesId })
        return veterinarians.map {
            it.copy(speciesIds = speciesByVeterinarian[it.veterinarian.id].orEmpty())
        }
    }

    // Inactive veterinarians cannot be booked, so the public list does not show them.
    fun findAllActive(filter: VeterinarianFilter): List<VeterinarianDetailsDto> = findAll(filter.copy(isActive = true))

    private fun VeterinarianDetailsDto.withSpecies(): VeterinarianDetailsDto = copy(
        speciesIds = permissionRepository.findAllByVeterinarianId(veterinarian.id).map { it.speciesId },
    )
}
