package com.bortnik.chiron.application.usecase.admin.user

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.domain.repositories.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteUserUseCase(private val userRepository: UserRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, id: UUID) {
        if (!userRepository.deleteById(id)) throw UserNotFoundException(id)
        log.info("Admin {} ({}) deleted user {}", actor.userId, actor.fullName, id)
    }
}
