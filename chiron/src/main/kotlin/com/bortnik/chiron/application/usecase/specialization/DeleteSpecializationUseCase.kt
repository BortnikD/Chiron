package com.bortnik.chiron.application.usecase.specialization

import com.bortnik.chiron.domain.exceptions.notfound.SpecializationNotFoundException
import com.bortnik.chiron.domain.repositories.SpecializationRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class DeleteSpecializationUseCase(private val specializationRepository: SpecializationRepository) {

    fun delete(id: UUID) {
        if (!specializationRepository.deleteById(id)) throw SpecializationNotFoundException(id)
    }
}
