package com.bortnik.chiron.application.usecase.admin.species

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.species.UpdateSpeciesDto
import com.bortnik.chiron.domain.entities.Species
import com.bortnik.chiron.domain.exceptions.alreadyexists.SpeciesAlreadyExistsException
import com.bortnik.chiron.domain.exceptions.notfound.SpeciesNotFoundException
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import com.bortnik.chiron.domain.utils.validators.SpeciesValidator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdateSpeciesUseCase(private val speciesRepository: SpeciesRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, id: UUID, dto: UpdateSpeciesDto): Species {
        SpeciesValidator.validate(dto)
        speciesRepository.findByName(dto.name)?.takeIf { it.id != id }?.let { throw SpeciesAlreadyExistsException.byName(dto.name) }
        val species = speciesRepository.update(id, dto) ?: throw SpeciesNotFoundException(id)
        log.info("Admin {} ({}) updated species {} '{}'", actor.userId, actor.fullName, species.id, species.name)
        return species
    }
}
