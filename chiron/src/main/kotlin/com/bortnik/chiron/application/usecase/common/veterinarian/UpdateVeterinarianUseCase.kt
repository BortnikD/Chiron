package com.bortnik.chiron.application.usecase.common.veterinarian

import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.exceptions.notfound.SpecializationNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.SpecializationRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.utils.validators.VeterinarianValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class UpdateVeterinarianUseCase(
    private val veterinarianRepository: VeterinarianRepository,
    private val specializationRepository: SpecializationRepository,
) {

    fun update(id: UUID, dto: UpdateVeterinarianDto): Veterinarian {
        VeterinarianValidator.validate(dto)
        val ids = dto.specializationIds ?: listOfNotNull(dto.specializationId)
        if (ids.isNotEmpty()) {
            val existingIds = specializationRepository.findAllByIds(ids).map { it.id }.toSet()
            ids.firstOrNull { it !in existingIds }?.let { throw SpecializationNotFoundException(it) }
        }
        return veterinarianRepository.update(id, dto) ?: throw VeterinarianNotFoundException(id)
    }
}
