package com.bortnik.chiron.application.usecase.common.pet

import com.bortnik.chiron.domain.dto.pet.CreatePetDto
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.utils.validators.PetValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate

@Service
@Transactional
class CreatePetUseCase(private val petRepository: PetRepository, private val clock: Clock) {

    fun create(dto: CreatePetDto): Pet {
        PetValidator.validate(dto, LocalDate.now(clock))
        return petRepository.create(dto)
    }
}
