package com.bortnik.chiron.application.usecase.servicespecies

import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.domain.exceptions.alreadyexists.ServiceSpeciesAlreadyExistsException
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.domain.utils.validators.ServiceSpeciesValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class CreateServiceSpeciesUseCase(private val serviceSpeciesRepository: ServiceSpeciesRepository) {

    fun create(serviceSpecies: ServiceSpecies): ServiceSpecies {
        ServiceSpeciesValidator.validate(serviceSpecies)
        if (serviceSpeciesRepository.findById(serviceSpecies.serviceId, serviceSpecies.speciesId) != null) {
            throw ServiceSpeciesAlreadyExistsException(serviceSpecies.serviceId, serviceSpecies.speciesId)
        }
        return serviceSpeciesRepository.create(serviceSpecies)
    }
}
