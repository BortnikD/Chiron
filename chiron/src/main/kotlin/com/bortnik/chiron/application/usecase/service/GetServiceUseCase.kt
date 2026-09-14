package com.bortnik.chiron.application.usecase.service

import com.bortnik.chiron.domain.entities.Service as ServiceEntity
import com.bortnik.chiron.domain.exceptions.notfound.ServiceNotFoundException
import com.bortnik.chiron.domain.repositories.ServiceRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetServiceUseCase(private val serviceRepository: ServiceRepository) {

    fun findById(id: UUID): ServiceEntity = serviceRepository.findById(id) ?: throw ServiceNotFoundException(id)

    fun findAllBySpecializationId(specializationId: UUID): List<ServiceEntity> =
        serviceRepository.findAllBySpecializationId(specializationId)

    fun findAll(): List<ServiceEntity> = serviceRepository.findAll()
}
