package com.bortnik.chiron.application.usecase.common.veterinarian

import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetVeterinarianUseCase(private val veterinarianRepository: VeterinarianRepository) {

    fun findById(id: UUID): VeterinarianDetailsDto =
        veterinarianRepository.findDetailsById(id) ?: throw VeterinarianNotFoundException(id)

    fun findByUserId(userId: UUID): VeterinarianDetailsDto =
        veterinarianRepository.findDetailsByUserId(userId) ?: throw VeterinarianNotFoundException("userId", userId)

    fun findAll(filter: VeterinarianFilter): List<VeterinarianDetailsDto> = veterinarianRepository.findAllDetails(filter)

    // Inactive veterinarians cannot be booked, so the public list does not show them.
    fun findAllActive(filter: VeterinarianFilter): List<VeterinarianDetailsDto> = findAll(filter.copy(isActive = true))
}
