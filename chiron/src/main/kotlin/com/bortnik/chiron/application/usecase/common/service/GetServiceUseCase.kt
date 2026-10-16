package com.bortnik.chiron.application.usecase.common.service

import com.bortnik.chiron.domain.dto.service.ServiceFilter
import com.bortnik.chiron.domain.entities.Service as ServiceEntity
import com.bortnik.chiron.domain.exceptions.notfound.ServiceNotFoundException
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetServiceUseCase(
    private val serviceRepository: ServiceRepository,
    private val serviceSpeciesRepository: ServiceSpeciesRepository,
) {

    fun findById(id: UUID): ServiceEntity = serviceRepository.findById(id) ?: throw ServiceNotFoundException(id)

    fun findAll(filter: ServiceFilter): List<ServiceEntity> = serviceRepository.findAll(filter)

    // Inactive services cannot be booked, so the public catalogue does not show them.
    fun findAllActive(filter: ServiceFilter): List<ServiceEntity> = findAll(filter.copy(isActive = true))

    // The species-specific override wins; without one the base price applies.
    fun findPriceForSpecies(serviceId: UUID, speciesId: UUID): Double =
        serviceSpeciesRepository.findById(serviceId, speciesId)?.price ?: findById(serviceId).basePrice
}
