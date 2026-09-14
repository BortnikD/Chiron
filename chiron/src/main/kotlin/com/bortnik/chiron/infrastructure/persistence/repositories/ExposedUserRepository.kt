package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.user.CreateUserDto
import com.bortnik.chiron.domain.dto.user.UpdateUserDto
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toUser
import com.bortnik.chiron.infrastructure.persistence.models.ExposedUserTable
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.javatime.CurrentTimestampWithTimeZone
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertReturning
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.updateReturning
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Transactional
class ExposedUserRepository : UserRepository {

    override fun create(dto: CreateUserDto): User = exposedSql {
        ExposedUserTable.insertReturning {
            it[email] = dto.email
            it[passwordHash] = dto.passwordHash
            it[firstName] = dto.firstName
            it[middleName] = dto.middleName
            it[lastName] = dto.lastName
            it[fullName] = dto.fullName
            it[phone] = dto.phone
            it[role] = dto.role
        }.single().toUser()
    }

    override fun findById(id: UUID): User? = exposedSql {
        ExposedUserTable.selectAll()
            .where { ExposedUserTable.id eq id }
            .singleOrNull()
            ?.toUser()
    }

    override fun findByEmail(email: String): User? = exposedSql {
        ExposedUserTable.selectAll()
            .where { ExposedUserTable.email.lowerCase() eq email.lowercase() }
            .singleOrNull()
            ?.toUser()
    }

    override fun findByPhone(phone: String): User? = exposedSql {
        ExposedUserTable.selectAll()
            .where { ExposedUserTable.phone eq phone }
            .singleOrNull()
            ?.toUser()
    }

    override fun findAll(): List<User> = exposedSql {
        ExposedUserTable.selectAll()
            .orderBy(ExposedUserTable.createdAt, SortOrder.ASC)
            .map { it.toUser() }
    }

    override fun update(id: UUID, dto: UpdateUserDto): User? = exposedSql {
        ExposedUserTable.updateReturning(where = { ExposedUserTable.id eq id }) {
            it[email] = dto.email
            it[passwordHash] = dto.passwordHash
            it[firstName] = dto.firstName
            it[middleName] = dto.middleName
            it[lastName] = dto.lastName
            it[fullName] = dto.fullName
            it[phone] = dto.phone
            it[role] = dto.role
            it[updatedAt] = CurrentTimestampWithTimeZone
        }.singleOrNull()?.toUser()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedUserTable.deleteWhere { ExposedUserTable.id eq id } > 0
    }
}
