package com.bortnik.chiron.application.usecase.user

import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.domain.repositories.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class DeleteUserUseCase(private val userRepository: UserRepository) {

    fun delete(id: UUID) {
        if (!userRepository.deleteById(id)) throw UserNotFoundException(id)
    }
}
