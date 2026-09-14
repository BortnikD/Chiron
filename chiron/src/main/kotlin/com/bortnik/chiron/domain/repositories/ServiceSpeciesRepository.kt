package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.servicespecies.UpdateServiceSpeciesDto
import com.bortnik.chiron.domain.entities.ServiceSpecies
import java.util.UUID

interface ServiceSpeciesRepository {
    fun create(serviceSpecies: ServiceSpecies): ServiceSpecies

    fun findById(serviceId: UUID, speciesId: UUID): ServiceSpecies?

    fun findAllByServiceId(serviceId: UUID): List<ServiceSpecies>

    fun update(serviceId: UUID, speciesId: UUID, dto: UpdateServiceSpeciesDto): ServiceSpecies?

    fun deleteById(serviceId: UUID, speciesId: UUID): Boolean
}
