package com.bortnik.chiron.application.usecase.admin.servicespecies

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.domain.exceptions.alreadyexists.ServiceSpeciesAlreadyExistsException
import com.bortnik.chiron.domain.exceptions.notfound.ServiceNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.SpeciesNotFoundException
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import com.bortnik.chiron.domain.utils.validators.ServiceSpeciesValidator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateServiceSpeciesUseCase(
    private val serviceSpeciesRepository: ServiceSpeciesRepository,
    private val serviceRepository: ServiceRepository,
    private val speciesRepository: SpeciesRepository,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun create(actor: Actor, serviceSpecies: ServiceSpecies): ServiceSpecies {
        ServiceSpeciesValidator.validate(serviceSpecies)
        if (serviceSpeciesRepository.findById(serviceSpecies.serviceId, serviceSpecies.speciesId) != null) {
            throw ServiceSpeciesAlreadyExistsException(serviceSpecies.serviceId, serviceSpecies.speciesId)
        }
        serviceRepository.findById(serviceSpecies.serviceId) ?: throw ServiceNotFoundException(serviceSpecies.serviceId)
        speciesRepository.findById(serviceSpecies.speciesId) ?: throw SpeciesNotFoundException(serviceSpecies.speciesId)
        val created = serviceSpeciesRepository.create(serviceSpecies)
        log.info(
            "Admin {} ({}) added species {} to service {}: price {}, duration {} min",
            actor.userId,
            actor.fullName,
            created.speciesId,
            created.serviceId,
            created.price,
            created.durationMin,
        )
        return created
    }
}
