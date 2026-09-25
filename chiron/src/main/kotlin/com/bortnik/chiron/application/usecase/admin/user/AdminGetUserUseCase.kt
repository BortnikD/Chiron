package com.bortnik.chiron.application.usecase.admin.user

import com.bortnik.chiron.application.usecase.common.user.GetUserUseCase
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.user.UserFilter
import com.bortnik.chiron.domain.entities.User
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AdminGetUserUseCase(private val getUserUseCase: GetUserUseCase) {

    fun findById(id: UUID): User = getUserUseCase.findById(id)

    fun findAll(filter: UserFilter, pageRequest: PageRequest): Page<User> =
        getUserUseCase.findAll(filter, pageRequest)
}
