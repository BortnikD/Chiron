package com.bortnik.chiron.application.usecase.admin.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteVeterinarianUseCase(private val veterinarianRepository: VeterinarianRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, id: UUID) {
        if (!veterinarianRepository.deleteById(id)) throw VeterinarianNotFoundException(id)
        log.info("Admin {} ({}) deleted veterinarian {}", actor.userId, actor.fullName, id)
    }
}
