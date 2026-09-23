package com.bortnik.chiron.application.usecase.admin.user

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.user.UpdateUserDto
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.exceptions.alreadyexists.UserAlreadyExistsException
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.utils.validators.UserValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdateUserUseCase(private val userRepository: UserRepository) {

    fun update(actor: Actor, id: UUID, dto: UpdateUserDto): User {
        UserValidator.validate(dto)
        userRepository.findByEmail(dto.email)?.takeIf { it.id != id }
            ?.let { throw UserAlreadyExistsException.byEmail(dto.email) }
        userRepository.findByPhone(dto.phone)?.takeIf { it.id != id }
            ?.let { throw UserAlreadyExistsException.byPhone(dto.phone) }
        return userRepository.update(id, dto) ?: throw UserNotFoundException(id)
    }
}
