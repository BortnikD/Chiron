package com.bortnik.chiron.application.usecase.admin.specialization

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.exceptions.notfound.SpecializationNotFoundException
import com.bortnik.chiron.domain.repositories.SpecializationRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteSpecializationUseCase(private val specializationRepository: SpecializationRepository) {

    fun delete(actor: Actor, id: UUID) {
        if (!specializationRepository.deleteById(id)) throw SpecializationNotFoundException(id)
    }
}
