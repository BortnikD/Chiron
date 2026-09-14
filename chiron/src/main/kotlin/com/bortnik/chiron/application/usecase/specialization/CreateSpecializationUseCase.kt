package com.bortnik.chiron.application.usecase.specialization

import com.bortnik.chiron.domain.dto.specialization.CreateSpecializationDto
import com.bortnik.chiron.domain.entities.Specialization
import com.bortnik.chiron.domain.repositories.SpecializationRepository
import com.bortnik.chiron.domain.utils.validators.SpecializationValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class CreateSpecializationUseCase(private val specializationRepository: SpecializationRepository) {

    fun create(dto: CreateSpecializationDto): Specialization {
        SpecializationValidator.validate(dto)
        return specializationRepository.create(dto)
    }
}
