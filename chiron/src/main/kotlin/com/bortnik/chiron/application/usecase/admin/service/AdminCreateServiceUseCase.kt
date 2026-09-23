package com.bortnik.chiron.application.usecase.admin.service

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.service.CreateServiceDto
import com.bortnik.chiron.domain.entities.Service as ServiceEntity
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.utils.validators.ServiceValidator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateServiceUseCase(private val serviceRepository: ServiceRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun create(actor: Actor, dto: CreateServiceDto): ServiceEntity {
        ServiceValidator.validate(dto)
        val service = serviceRepository.create(dto)
        log.info(
            "Admin {} ({}) created service {} '{}' with base price {}",
            actor.userId,
            actor.fullName,
            service.id,
            service.name,
            service.basePrice,
        )
        return service
    }
}
