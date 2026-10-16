package com.bortnik.chiron.application.usecase.admin.servicespecies

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.exceptions.notfound.ServiceSpeciesNotFoundException
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteServiceSpeciesUseCase(private val serviceSpeciesRepository: ServiceSpeciesRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, serviceId: UUID, speciesId: UUID) {
        if (!serviceSpeciesRepository.deleteById(serviceId, speciesId)) {
            throw ServiceSpeciesNotFoundException(serviceId, speciesId)
        }
        log.info("Admin {} ({}) removed species {} from service {}", actor.userId, actor.fullName, speciesId, serviceId)
    }
}
