package com.bortnik.chiron.application.usecase.admin.species

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.species.CreateSpeciesDto
import com.bortnik.chiron.domain.entities.Species
import com.bortnik.chiron.domain.exceptions.alreadyexists.SpeciesAlreadyExistsException
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import com.bortnik.chiron.domain.utils.validators.SpeciesValidator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateSpeciesUseCase(private val speciesRepository: SpeciesRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun create(actor: Actor, dto: CreateSpeciesDto): Species {
        SpeciesValidator.validate(dto)
        if (speciesRepository.findByName(dto.name) != null) throw SpeciesAlreadyExistsException.byName(dto.name)
        val species = speciesRepository.create(dto)
        log.info("Admin {} ({}) created species {} '{}'", actor.userId, actor.fullName, species.id, species.name)
        return species
    }
}
