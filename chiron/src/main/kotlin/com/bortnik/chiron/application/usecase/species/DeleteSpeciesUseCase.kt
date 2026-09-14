package com.bortnik.chiron.application.usecase.species

import com.bortnik.chiron.domain.exceptions.notfound.SpeciesNotFoundException
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class DeleteSpeciesUseCase(private val speciesRepository: SpeciesRepository) {

    fun delete(id: UUID) {
        if (!speciesRepository.deleteById(id)) throw SpeciesNotFoundException(id)
    }
}
