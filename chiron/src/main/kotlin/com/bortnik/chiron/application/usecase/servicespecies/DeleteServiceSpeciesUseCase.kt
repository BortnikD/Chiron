package com.bortnik.chiron.application.usecase.servicespecies

import com.bortnik.chiron.domain.exceptions.notfound.ServiceSpeciesNotFoundException
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class DeleteServiceSpeciesUseCase(private val serviceSpeciesRepository: ServiceSpeciesRepository) {

    fun delete(serviceId: UUID, speciesId: UUID) {
        if (!serviceSpeciesRepository.deleteById(serviceId, speciesId)) {
            throw ServiceSpeciesNotFoundException(serviceId, speciesId)
        }
    }
}
