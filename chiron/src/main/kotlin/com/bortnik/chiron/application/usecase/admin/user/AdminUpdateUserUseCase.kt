package com.bortnik.chiron.application.usecase.admin.user

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.user.UpdateUserUseCase
import com.bortnik.chiron.domain.dto.user.UpdateProfileDto
import com.bortnik.chiron.domain.entities.User
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdateUserUseCase(private val updateUserUseCase: UpdateUserUseCase) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, id: UUID, dto: UpdateProfileDto): User {
        val user = updateUserUseCase.update(id, dto)
        log.info(
            "Admin {} ({}) updated user {} ({})",
            actor.userId,
            actor.fullName,
            user.id,
            user.fullName,
        )
        return user
    }
}
