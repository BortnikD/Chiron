package com.bortnik.chiron.application.usecase.species

import com.bortnik.chiron.domain.entities.Species
import com.bortnik.chiron.domain.exceptions.notfound.SpeciesNotFoundException
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetSpeciesUseCase(private val speciesRepository: SpeciesRepository) {

    fun findById(id: UUID): Species = speciesRepository.findById(id) ?: throw SpeciesNotFoundException(id)

    fun findByName(name: String): Species =
        speciesRepository.findByName(name) ?: throw SpeciesNotFoundException("name", name)

    fun findAll(): List<Species> = speciesRepository.findAll()
}
