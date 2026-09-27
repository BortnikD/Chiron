package com.bortnik.chiron.application.usecase.common.user

import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.dto.user.UpdateProfileDto
import com.bortnik.chiron.domain.dto.user.UpdateUserDto
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.exceptions.alreadyexists.UserAlreadyExistsException
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.utils.FullNameFormatter
import com.bortnik.chiron.domain.utils.validators.UserValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class UpdateUserUseCase(private val userRepository: UserRepository) {

    fun update(id: UUID, dto: UpdateProfileDto): User {
        UserValidator.validate(dto)
        val existing = userRepository.findById(id) ?: throw UserNotFoundException(id)
        dto.email?.let { email ->
            userRepository.findByEmail(email)?.takeIf { it.id != id }
                ?.let { throw UserAlreadyExistsException.byEmail(email) }
        }
        dto.phone?.let { phone ->
            userRepository.findByPhone(phone)?.takeIf { it.id != id }
                ?.let { throw UserAlreadyExistsException.byPhone(phone) }
        }
        // A partial update may change only one name part, so fullName is rebuilt from the merged values;
        // it is written only when it changes, which keeps an empty patch empty.
        val fullName = FullNameFormatter.format(
            dto.firstName ?: existing.firstName,
            dto.middleName.orElse(existing.middleName),
            dto.lastName ?: existing.lastName,
        ).takeIf { it != existing.fullName }
        val update = UpdateUserDto(
            email = dto.email,
            firstName = dto.firstName,
            middleName = dto.middleName,
            lastName = dto.lastName,
            fullName = fullName,
            phone = dto.phone,
        )
        return userRepository.update(id, update) ?: throw UserNotFoundException(id)
    }
}
