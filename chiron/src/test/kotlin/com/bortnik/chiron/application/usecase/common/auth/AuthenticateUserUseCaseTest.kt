package com.bortnik.chiron.application.usecase.common.auth

import com.bortnik.chiron.domain.exceptions.InvalidCredentialsException
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.support.TestEntities.user
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import org.springframework.security.crypto.password.PasswordEncoder
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class AuthenticateUserUseCaseTest {
    private val repository = mock(UserRepository::class.java)
    private val encoder = mock(PasswordEncoder::class.java)
    private val useCase = AuthenticateUserUseCase(repository, encoder)

    @Test
    fun `unknown email and wrong password produce the same public failure`() {
        val unknown =
            assertFailsWith<InvalidCredentialsException> { useCase.authenticate(user.email, "wrong-password") }
        `when`(repository.findByEmail(user.email)).thenReturn(user)
        val wrong = assertFailsWith<InvalidCredentialsException> { useCase.authenticate(user.email, "wrong-password") }
        assertEquals(unknown.message, wrong.message)
    }

    @Test
    fun `password above bcrypt utf8 byte limit is rejected before database and encoder access`() {
        for (password in listOf("a".repeat(73), "\u00E9".repeat(37))) {
            assertFailsWith<InvalidCredentialsException> { useCase.authenticate(user.email, password) }
        }
        verifyNoInteractions(repository, encoder)
    }

    @Test
    fun `oversized credentials are rejected before database access`() {
        assertFailsWith<ValidationException> { useCase.authenticate("a".repeat(10000), "password") }
        assertFailsWith<ValidationException> { useCase.authenticate(user.email, "a".repeat(10000)) }
        verifyNoInteractions(repository, encoder)
    }
}
