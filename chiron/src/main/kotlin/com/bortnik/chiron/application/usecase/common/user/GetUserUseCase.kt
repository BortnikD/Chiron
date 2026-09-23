package com.bortnik.chiron.application.usecase.common.user

import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.domain.repositories.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetUserUseCase(private val userRepository: UserRepository) {

    fun findById(id: UUID): User = userRepository.findById(id) ?: throw UserNotFoundException(id)

    fun findByEmail(email: String): User =
        userRepository.findByEmail(email) ?: throw UserNotFoundException("email", email)

    fun findByPhone(phone: String): User =
        userRepository.findByPhone(phone) ?: throw UserNotFoundException("phone", phone)

    fun findAll(): List<User> = userRepository.findAll()
}
