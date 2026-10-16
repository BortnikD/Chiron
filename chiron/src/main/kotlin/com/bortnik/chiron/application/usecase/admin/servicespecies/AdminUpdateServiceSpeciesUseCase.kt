package com.bortnik.chiron.application.usecase.admin.servicespecies

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.servicespecies.UpdateServiceSpeciesDto
import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.domain.exceptions.notfound.ServiceSpeciesNotFoundException
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.domain.utils.validators.ServiceSpeciesValidator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdateServiceSpeciesUseCase(private val serviceSpeciesRepository: ServiceSpeciesRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, serviceId: UUID, speciesId: UUID, dto: UpdateServiceSpeciesDto): ServiceSpecies {
        ServiceSpeciesValidator.validate(dto)
        val updated = serviceSpeciesRepository.update(serviceId, speciesId, dto)
            ?: throw ServiceSpeciesNotFoundException(serviceId, speciesId)
        log.info(
            "Admin {} ({}) updated species {} of service {}: price {}, duration {} min",
            actor.userId,
            actor.fullName,
            speciesId,
            serviceId,
            updated.price,
            updated.durationMin,
        )
        return updated
    }
}
