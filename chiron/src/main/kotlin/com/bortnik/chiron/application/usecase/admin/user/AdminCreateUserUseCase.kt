package com.bortnik.chiron.application.usecase.admin.user

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.user.RegisterUserUseCase
import com.bortnik.chiron.domain.dto.user.RegisterUserDto
import com.bortnik.chiron.domain.entities.User
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateUserUseCase(private val registerUserUseCase: RegisterUserUseCase) {

    fun create(actor: Actor, dto: RegisterUserDto): User = registerUserUseCase.register(dto)
}
