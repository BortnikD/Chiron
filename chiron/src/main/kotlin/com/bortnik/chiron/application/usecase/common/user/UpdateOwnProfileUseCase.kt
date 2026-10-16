package com.bortnik.chiron.application.usecase.common.user

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.user.UpdateProfileDto
import com.bortnik.chiron.domain.entities.User
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

// Serves every role, so it lives in common/ but still takes the actor: it scopes the update to the current user
// and records who made it.
@Service
@Transactional
class UpdateOwnProfileUseCase(private val updateUserUseCase: UpdateUserUseCase) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, dto: UpdateProfileDto): User {
        val user = updateUserUseCase.update(actor.userId, dto)
        log.info(
            "{} {} ({}) updated own profile, full name is now {}",
            actor.role,
            actor.userId,
            actor.fullName,
            user.fullName,
        )
        return user
    }
}
