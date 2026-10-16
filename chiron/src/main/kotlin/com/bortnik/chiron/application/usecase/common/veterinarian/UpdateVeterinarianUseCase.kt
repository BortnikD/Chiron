package com.bortnik.chiron.application.usecase.common.veterinarian

import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.utils.validators.VeterinarianValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class UpdateVeterinarianUseCase(private val veterinarianRepository: VeterinarianRepository) {

    fun update(id: UUID, dto: UpdateVeterinarianDto): Veterinarian {
        VeterinarianValidator.validate(dto)
        return veterinarianRepository.update(id, dto) ?: throw VeterinarianNotFoundException(id)
    }
}
