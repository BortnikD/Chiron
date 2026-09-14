package com.bortnik.chiron.application.usecase.user

import com.bortnik.chiron.domain.dto.user.CreateUserDto
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.exceptions.alreadyexists.UserAlreadyExistsException
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.utils.validators.UserValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class CreateUserUseCase(private val userRepository: UserRepository) {

    fun create(dto: CreateUserDto): User {
        UserValidator.validate(dto)
        if (userRepository.findByEmail(dto.email) != null) throw UserAlreadyExistsException.byEmail(dto.email)
        if (userRepository.findByPhone(dto.phone) != null) throw UserAlreadyExistsException.byPhone(dto.phone)
        return userRepository.create(dto)
    }
}
