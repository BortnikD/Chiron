package com.bortnik.chiron.application.usecase.specialization

import com.bortnik.chiron.domain.dto.specialization.UpdateSpecializationDto
import com.bortnik.chiron.domain.entities.Specialization
import com.bortnik.chiron.domain.exceptions.notfound.SpecializationNotFoundException
import com.bortnik.chiron.domain.repositories.SpecializationRepository
import com.bortnik.chiron.domain.utils.validators.SpecializationValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class UpdateSpecializationUseCase(private val specializationRepository: SpecializationRepository) {

    fun update(id: UUID, dto: UpdateSpecializationDto): Specialization {
        SpecializationValidator.validate(dto)
        return specializationRepository.update(id, dto) ?: throw SpecializationNotFoundException(id)
    }
}
