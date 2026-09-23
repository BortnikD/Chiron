package com.bortnik.chiron.application.usecase.admin.servicespecies

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.servicespecies.UpdateServiceSpeciesDto
import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.domain.exceptions.notfound.ServiceSpeciesNotFoundException
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.domain.utils.validators.ServiceSpeciesValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdateServiceSpeciesUseCase(private val serviceSpeciesRepository: ServiceSpeciesRepository) {

    fun update(actor: Actor, serviceId: UUID, speciesId: UUID, dto: UpdateServiceSpeciesDto): ServiceSpecies {
        ServiceSpeciesValidator.validate(dto)
        return serviceSpeciesRepository.update(serviceId, speciesId, dto)
            ?: throw ServiceSpeciesNotFoundException(serviceId, speciesId)
    }
}
