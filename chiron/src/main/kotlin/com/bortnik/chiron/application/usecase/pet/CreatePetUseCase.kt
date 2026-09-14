package com.bortnik.chiron.application.usecase.pet

import com.bortnik.chiron.domain.dto.pet.CreatePetDto
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.utils.validators.PetValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class CreatePetUseCase(private val petRepository: PetRepository) {

    fun create(dto: CreatePetDto): Pet {
        PetValidator.validate(dto)
        return petRepository.create(dto)
    }
}
