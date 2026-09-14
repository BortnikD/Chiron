package com.bortnik.chiron.application.usecase.service

import com.bortnik.chiron.domain.dto.service.CreateServiceDto
import com.bortnik.chiron.domain.entities.Service as ServiceEntity
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.utils.validators.ServiceValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class CreateServiceUseCase(private val serviceRepository: ServiceRepository) {

    fun create(dto: CreateServiceDto): ServiceEntity {
        ServiceValidator.validate(dto)
        return serviceRepository.create(dto)
    }
}
