package com.bortnik.chiron.application.usecase.common.user

import com.bortnik.chiron.application.security.toActor
import com.bortnik.chiron.application.usecase.common.auth.AuthenticateUserUseCase
import com.bortnik.chiron.domain.dto.user.ChangePasswordDto
import com.bortnik.chiron.domain.dto.user.UpdateUserDto
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.InvalidCredentialsException
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.infrastructure.security.JwtActorResolver
import com.bortnik.chiron.infrastructure.security.jwt.JwtProperties
import com.bortnik.chiron.infrastructure.security.jwt.JwtTokenProvider
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.any
import org.mockito.Mockito.eq
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import java.time.Duration
import java.time.Instant
import java.util.Base64
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class ChangeOwnPasswordUseCaseTest {

    private val encoder = BCryptPasswordEncoder(4)
    private val repository = mock(UserRepository::class.java)
    private val useCase = ChangeOwnPasswordUseCase(repository, encoder)

    @Test
    fun `every role can change own password and only the new password authenticates`() {
        for (role in UserRole.entries) {
            val before = user().copy(role = role)
            allowPasswordUpdate(before)

            useCase.change(before.toActor(), ChangePasswordDto("old-password", "new-password"))

            val update = passwordUpdate(before)
            val hash = requireNotNull(update.passwordHash)
            assertEquals(UpdateUserDto(passwordHash = hash), update)
            assertNotEquals("new-password", hash)
            assertTrue(encoder.matches("new-password", hash))
            assertFalse(encoder.matches("old-password", hash))
            `when`(repository.findByEmail(before.email)).thenReturn(before.copy(passwordHash = hash))
            val authenticate = AuthenticateUserUseCase(repository, encoder)
            assertEquals(before.id, authenticate.authenticate(before.email, "new-password").id)
            assertFailsWith<InvalidCredentialsException> {
                authenticate.authenticate(before.email, "old-password")
            }
            verify(repository).findById(before.id)
        }
        verify(repository, times(UserRole.entries.size * 2)).findByEmail("client@example.com")
        verifyNoMoreInteractions(repository)
    }

    @Test
    fun `incorrect current password leaves the stored password unchanged`() {
        val before = user()
        `when`(repository.findById(before.id)).thenReturn(before)

        assertFailsWith<InvalidCredentialsException> {
            useCase.change(before.toActor(), ChangePasswordDto("wrong-password", "new-password"))
        }

        verify(repository).findById(before.id)
        verifyNoMoreInteractions(repository)
    }

    @Test
    fun `current password exceeding the bcrypt byte limit is rejected without updating`() {
        val before = user()
        `when`(repository.findById(before.id)).thenReturn(before)
        assertFailsWith<InvalidCredentialsException> {
            useCase.change(before.toActor(), ChangePasswordDto("\u00E9".repeat(37), "new-password"))
        }

        verify(repository).findById(before.id)
        verifyNoMoreInteractions(repository)
    }

    @Test
    fun `invalid new passwords are rejected without updating`() {
        val before = user()
        for (password in listOf("", "1234567", "a".repeat(73), "\u00E9".repeat(37))) {
            val ex = assertFailsWith<ValidationException> {
                useCase.change(before.toActor(), ChangePasswordDto("old-password", password))
            }

            assertEquals(listOf("newPassword"), ex.errors.map { it.field })
        }
        verifyNoInteractions(repository)
    }

    @Test
    fun `new passwords at the character and utf8 byte limits are accepted`() {
        for (password in listOf("12345678", "\u00E9".repeat(36))) {
            val before = user()
            allowPasswordUpdate(before)

            useCase.change(before.toActor(), ChangePasswordDto("old-password", password))

            assertTrue(encoder.matches(password, requireNotNull(passwordUpdate(before).passwordHash)))
            verify(repository).findById(before.id)
        }
        verifyNoMoreInteractions(repository)
    }

    @Test
    fun `password change preserves previously issued tokens`() {
        val before = user()
        allowPasswordUpdate(before)
        val secret = Base64.getEncoder().encodeToString(ByteArray(32) { it.toByte() })
        val provider = JwtTokenProvider(JwtProperties(secret, Duration.ofDays(30)))
        val token = provider.generate(before)

        useCase.change(before.toActor(), ChangePasswordDto("old-password", "new-password"))
        val updated = before.copy(passwordHash = requireNotNull(passwordUpdate(before).passwordHash))
        `when`(repository.findById(before.id)).thenReturn(updated)

        val resolver = JwtActorResolver(provider, GetUserUseCase(repository))
        assertEquals(updated.toActor(), resolver.resolve("Bearer $token"))
        verify(repository, times(2)).findById(before.id)
        verifyNoMoreInteractions(repository)
    }

    private fun user() = User(
        id = UUID.randomUUID(),
        email = "client@example.com",
        passwordHash = requireNotNull(encoder.encode("old-password")),
        firstName = "Ivan",
        lastName = "Petrov",
        fullName = "I. Petrov",
        phone = "+79990000000",
        role = UserRole.CLIENT,
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
    )

    private fun allowPasswordUpdate(user: User) {
        `when`(repository.findById(user.id)).thenReturn(user)
        `when`(
            repository.update(eq(user.id) ?: user.id, any(UpdateUserDto::class.java) ?: UpdateUserDto()),
        ).thenReturn(user)
    }

    private fun passwordUpdate(user: User): UpdateUserDto {
        val captor = ArgumentCaptor.forClass(UpdateUserDto::class.java)
        verify(repository).update(eq(user.id) ?: user.id, captor.capture() ?: UpdateUserDto())
        return captor.value
    }
}
