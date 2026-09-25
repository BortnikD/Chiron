package com.bortnik.chiron.application.usecase.common.user

import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.user.UserFilter
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.utils.validators.PageRequestValidator
import com.bortnik.chiron.domain.utils.validators.UserValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetUserUseCase(private val userRepository: UserRepository) {

    fun findById(id: UUID): User = userRepository.findById(id) ?: throw UserNotFoundException(id)

    fun findAll(filter: UserFilter, pageRequest: PageRequest): Page<User> {
        UserValidator.validate(filter)
        PageRequestValidator.validate(pageRequest)
        return userRepository.findAll(filter, pageRequest)
    }
}
