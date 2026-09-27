package com.bortnik.chiron.application.usecase.common.user

import com.bortnik.chiron.domain.dto.user.CreateUserDto
import com.bortnik.chiron.domain.dto.user.RegisterUserDto
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.utils.FullNameFormatter
import com.bortnik.chiron.domain.utils.validators.UserValidator
import org.slf4j.LoggerFactory
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class RegisterUserUseCase(
    private val createUserUseCase: CreateUserUseCase,
    private val passwordEncoder: PasswordEncoder,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun register(dto: RegisterUserDto): User {
        UserValidator.validate(dto)
        val user = createUserUseCase.create(
            CreateUserDto(
                email = dto.email,
                passwordHash = requireNotNull(passwordEncoder.encode(dto.password)),
                firstName = dto.firstName,
                middleName = dto.middleName,
                lastName = dto.lastName,
                fullName = FullNameFormatter.format(dto.firstName, dto.middleName, dto.lastName),
                phone = dto.phone,
                role = dto.role,
            ),
        )
        log.info("User {} ({}) registered with role {}", user.id, user.fullName, user.role)
        return user
    }
}
