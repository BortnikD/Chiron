package com.bortnik.chiron.application.usecase.species

import com.bortnik.chiron.domain.dto.species.CreateSpeciesDto
import com.bortnik.chiron.domain.entities.Species
import com.bortnik.chiron.domain.exceptions.alreadyexists.SpeciesAlreadyExistsException
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import com.bortnik.chiron.domain.utils.validators.SpeciesValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class CreateSpeciesUseCase(private val speciesRepository: SpeciesRepository) {

    fun create(dto: CreateSpeciesDto): Species {
        SpeciesValidator.validate(dto)
        if (speciesRepository.findByName(dto.name) != null) throw SpeciesAlreadyExistsException.byName(dto.name)
        return speciesRepository.create(dto)
    }
}
