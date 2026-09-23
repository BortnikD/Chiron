package com.bortnik.chiron.application.usecase.admin.user

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.user.GetUserUseCase
import com.bortnik.chiron.domain.entities.User
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AdminGetUserUseCase(private val getUserUseCase: GetUserUseCase) {

    fun findById(actor: Actor, id: UUID): User = getUserUseCase.findById(id)

    fun findByEmail(actor: Actor, email: String): User = getUserUseCase.findByEmail(email)

    fun findByPhone(actor: Actor, phone: String): User = getUserUseCase.findByPhone(phone)

    fun findAll(actor: Actor): List<User> = getUserUseCase.findAll()
}
