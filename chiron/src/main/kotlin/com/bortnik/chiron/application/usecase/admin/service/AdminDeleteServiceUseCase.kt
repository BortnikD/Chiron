package com.bortnik.chiron.application.usecase.admin.service

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.exceptions.notfound.ServiceNotFoundException
import com.bortnik.chiron.domain.repositories.ServiceRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteServiceUseCase(private val serviceRepository: ServiceRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, id: UUID) {
        if (!serviceRepository.deleteById(id)) throw ServiceNotFoundException(id)
        log.info("Admin {} ({}) deleted service {}", actor.userId, actor.fullName, id)
    }
}
