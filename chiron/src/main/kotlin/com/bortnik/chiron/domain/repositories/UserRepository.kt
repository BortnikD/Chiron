package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.user.CreateUserDto
import com.bortnik.chiron.domain.dto.user.UpdateUserDto
import com.bortnik.chiron.domain.dto.user.UserFilter
import com.bortnik.chiron.domain.entities.User
import java.util.UUID

interface UserRepository {
    fun create(dto: CreateUserDto): User

    fun findById(id: UUID): User?

    fun findByEmail(email: String): User?

    fun findByPhone(phone: String): User?

    fun findAll(filter: UserFilter, pageRequest: PageRequest): Page<User>

    fun update(id: UUID, dto: UpdateUserDto): User?

    fun deleteById(id: UUID): Boolean
}
