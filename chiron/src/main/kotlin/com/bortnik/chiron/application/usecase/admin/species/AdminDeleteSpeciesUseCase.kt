package com.bortnik.chiron.application.usecase.admin.species

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.exceptions.notfound.SpeciesNotFoundException
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteSpeciesUseCase(private val speciesRepository: SpeciesRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, id: UUID) {
        if (!speciesRepository.deleteById(id)) throw SpeciesNotFoundException(id)
        log.info("Admin {} ({}) deleted species {}", actor.userId, actor.fullName, id)
    }
}
