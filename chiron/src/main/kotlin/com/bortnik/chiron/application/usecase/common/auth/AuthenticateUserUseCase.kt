package com.bortnik.chiron.application.usecase.common.auth

import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.exceptions.InvalidCredentialsException
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.utils.ValidationConstants.UserRules
import com.bortnik.chiron.domain.utils.validators.UserValidator
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class AuthenticateUserUseCase(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
) {

    // The same exception for an unknown email and a wrong password, so accounts cannot be enumerated.
    fun authenticate(email: String, password: String): User {
        UserValidator.validateCredentials(email, password)
        // Registration caps passwords at the BCrypt limit, so a longer one can never match,
        // and passing it to BCrypt would throw instead of failing the check.
        if (password.encodeToByteArray().size > UserRules.PASSWORD_MAX_BYTES) throw InvalidCredentialsException()
        val user = userRepository.findByEmail(email) ?: throw InvalidCredentialsException()
        if (!passwordEncoder.matches(password, user.passwordHash)) throw InvalidCredentialsException()
        return user
    }
}
