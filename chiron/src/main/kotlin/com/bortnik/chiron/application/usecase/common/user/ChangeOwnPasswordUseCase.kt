package com.bortnik.chiron.application.usecase.common.user

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.user.ChangePasswordDto
import com.bortnik.chiron.domain.dto.user.UpdateUserDto
import com.bortnik.chiron.domain.exceptions.InvalidCredentialsException
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.utils.ValidationConstants.UserRules
import com.bortnik.chiron.domain.utils.validators.UserValidator
import org.slf4j.LoggerFactory
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class ChangeOwnPasswordUseCase(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun change(actor: Actor, dto: ChangePasswordDto) {
        UserValidator.validate(dto)
        val user = userRepository.findById(actor.userId) ?: throw UserNotFoundException(actor.userId)
        if (dto.currentPassword.encodeToByteArray().size > UserRules.PASSWORD_MAX_BYTES ||
            !passwordEncoder.matches(dto.currentPassword, user.passwordHash)
        ) {
            throw InvalidCredentialsException("Invalid current password")
        }
        val update = UpdateUserDto(passwordHash = requireNotNull(passwordEncoder.encode(dto.newPassword)))
        userRepository.update(actor.userId, update) ?: throw UserNotFoundException(actor.userId)
        log.info("{} {} ({}) changed own password", actor.role, actor.userId, actor.fullName)
    }
}
