package com.bortnik.chiron.application.usecase.species

import com.bortnik.chiron.domain.dto.species.UpdateSpeciesDto
import com.bortnik.chiron.domain.entities.Species
import com.bortnik.chiron.domain.exceptions.alreadyexists.SpeciesAlreadyExistsException
import com.bortnik.chiron.domain.exceptions.notfound.SpeciesNotFoundException
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import com.bortnik.chiron.domain.utils.validators.SpeciesValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class UpdateSpeciesUseCase(private val speciesRepository: SpeciesRepository) {

    fun update(id: UUID, dto: UpdateSpeciesDto): Species {
        SpeciesValidator.validate(dto)
        speciesRepository.findByName(dto.name)?.takeIf { it.id != id }?.let { throw SpeciesAlreadyExistsException.byName(dto.name) }
        return speciesRepository.update(id, dto) ?: throw SpeciesNotFoundException(id)
    }
}
