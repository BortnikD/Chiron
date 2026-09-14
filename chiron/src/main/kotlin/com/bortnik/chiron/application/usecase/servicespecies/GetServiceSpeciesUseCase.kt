package com.bortnik.chiron.application.usecase.servicespecies

import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.domain.exceptions.notfound.ServiceSpeciesNotFoundException
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetServiceSpeciesUseCase(private val serviceSpeciesRepository: ServiceSpeciesRepository) {

    fun findById(serviceId: UUID, speciesId: UUID): ServiceSpecies =
        serviceSpeciesRepository.findById(serviceId, speciesId)
            ?: throw ServiceSpeciesNotFoundException(serviceId, speciesId)

    fun findAllByServiceId(serviceId: UUID): List<ServiceSpecies> =
        serviceSpeciesRepository.findAllByServiceId(serviceId)
}
