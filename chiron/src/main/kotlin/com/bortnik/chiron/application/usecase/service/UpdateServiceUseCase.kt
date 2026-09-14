package com.bortnik.chiron.application.usecase.service

import com.bortnik.chiron.domain.dto.service.UpdateServiceDto
import com.bortnik.chiron.domain.entities.Service as ServiceEntity
import com.bortnik.chiron.domain.exceptions.notfound.ServiceNotFoundException
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.utils.validators.ServiceValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class UpdateServiceUseCase(private val serviceRepository: ServiceRepository) {

    fun update(id: UUID, dto: UpdateServiceDto): ServiceEntity {
        ServiceValidator.validate(dto)
        return serviceRepository.update(id, dto) ?: throw ServiceNotFoundException(id)
    }
}
