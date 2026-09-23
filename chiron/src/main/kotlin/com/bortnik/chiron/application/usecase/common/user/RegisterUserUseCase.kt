package com.bortnik.chiron.application.usecase.common.user

import com.bortnik.chiron.domain.dto.user.CreateUserDto
import com.bortnik.chiron.domain.dto.user.RegisterUserDto
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.utils.validators.UserValidator
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class RegisterUserUseCase(
    private val createUserUseCase: CreateUserUseCase,
    private val passwordEncoder: PasswordEncoder,
) {

    fun register(dto: RegisterUserDto): User {
        UserValidator.validate(dto)
        return createUserUseCase.create(
            CreateUserDto(
                email = dto.email,
                passwordHash = requireNotNull(passwordEncoder.encode(dto.password)),
                firstName = dto.firstName,
                middleName = dto.middleName,
                lastName = dto.lastName,
                fullName = listOfNotNull(dto.lastName, dto.firstName, dto.middleName).joinToString(" "),
                phone = dto.phone,
                role = dto.role,
            ),
        )
    }
}
