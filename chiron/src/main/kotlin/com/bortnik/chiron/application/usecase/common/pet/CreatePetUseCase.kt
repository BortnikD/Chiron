package com.bortnik.chiron.application.usecase.common.pet

import com.bortnik.chiron.domain.dto.pet.CreatePetDto
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.exceptions.notfound.SpeciesNotFoundException
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import com.bortnik.chiron.domain.utils.validators.PetValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate

@Service
@Transactional
class CreatePetUseCase(
    private val petRepository: PetRepository,
    private val clock: Clock,
    private val speciesRepository: SpeciesRepository,
) {

    fun create(dto: CreatePetDto): Pet {
        PetValidator.validate(dto, LocalDate.now(clock))
        speciesRepository.findById(dto.speciesId) ?: throw SpeciesNotFoundException(dto.speciesId)
        return petRepository.create(dto)
    }
}
