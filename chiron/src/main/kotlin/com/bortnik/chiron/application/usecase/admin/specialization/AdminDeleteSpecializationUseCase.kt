package com.bortnik.chiron.application.usecase.admin.specialization

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.exceptions.notfound.SpecializationNotFoundException
import com.bortnik.chiron.domain.repositories.SpecializationRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteSpecializationUseCase(private val specializationRepository: SpecializationRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, id: UUID) {
        if (!specializationRepository.deleteById(id)) throw SpecializationNotFoundException(id)
        log.info("Admin {} ({}) deleted specialization {}", actor.userId, actor.fullName, id)
    }
}
