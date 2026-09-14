package com.bortnik.chiron.application.usecase.service

import com.bortnik.chiron.domain.exceptions.notfound.ServiceNotFoundException
import com.bortnik.chiron.domain.repositories.ServiceRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class DeleteServiceUseCase(private val serviceRepository: ServiceRepository) {

    fun delete(id: UUID) {
        if (!serviceRepository.deleteById(id)) throw ServiceNotFoundException(id)
    }
}
