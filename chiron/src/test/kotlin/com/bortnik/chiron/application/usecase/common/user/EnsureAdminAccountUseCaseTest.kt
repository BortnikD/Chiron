package com.bortnik.chiron.application.usecase.common.user

import com.bortnik.chiron.application.config.AdminProperties
import com.bortnik.chiron.domain.dto.user.RegisterUserDto
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.support.TestEntities.user
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`

class EnsureAdminAccountUseCaseTest {
    private val repository = mock(UserRepository::class.java)
    private val register = mock(RegisterUserUseCase::class.java)
    private val config = AdminProperties(user.email, "admin-password", user.phone, user.firstName, user.lastName)
    private val useCase = EnsureAdminAccountUseCase(config, repository, register)

    @Test
    fun `missing account is registered as admin once and repeated startup leaves it untouched`() {
        val admin = user.copy(role = UserRole.ADMIN)
        val expected = RegisterUserDto(
            config.email,
            config.password,
            config.firstName,
            lastName = config.lastName,
            phone = config.phone,
            role = UserRole.ADMIN
        )
        `when`(repository.findByEmail(config.email)).thenReturn(null, admin)
        `when`(register.register(expected)).thenReturn(admin)
        repeat(2) { useCase.ensure() }
        verify(register).register(expected)
        verify(repository, times(2)).findByEmail(config.email)
        verifyNoMoreInteractions(register, repository)
    }

    @Test
    fun `existing accounts of every role are never overwritten or promoted`() {
        for (role in UserRole.entries) {
            `when`(repository.findByEmail(config.email)).thenReturn(
                user.copy(
                    role = role,
                    passwordHash = "Existing password hash"
                )
            )
            useCase.ensure()
        }
        verify(repository, times(UserRole.entries.size)).findByEmail(config.email)
        verifyNoMoreInteractions(repository)
        verifyNoInteractions(register)
    }
}
