package com.bortnik.chiron.application.usecase.admin.user

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.user.RegisterUserUseCase
import com.bortnik.chiron.domain.dto.user.RegisterUserDto
import com.bortnik.chiron.domain.entities.User
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateUserUseCase(private val registerUserUseCase: RegisterUserUseCase) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun create(actor: Actor, dto: RegisterUserDto): User {
        val user = registerUserUseCase.register(dto)
        log.info(
            "Admin {} ({}) created user {} ({}) with role {}",
            actor.userId,
            actor.fullName,
            user.id,
            user.fullName,
            user.role,
        )
        return user
    }
}
