package com.bortnik.chiron.application.usecase.common.user

import com.bortnik.chiron.application.security.toActor
import com.bortnik.chiron.application.usecase.common.auth.AuthenticateUserUseCase
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.user.ChangePasswordDto
import com.bortnik.chiron.domain.dto.user.CreateUserDto
import com.bortnik.chiron.domain.dto.user.UpdateUserDto
import com.bortnik.chiron.domain.dto.user.UserFilter
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.InvalidCredentialsException
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.infrastructure.security.JwtActorResolver
import com.bortnik.chiron.infrastructure.security.jwt.JwtProperties
import com.bortnik.chiron.infrastructure.security.jwt.JwtTokenProvider
import org.junit.jupiter.api.Test
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
    private val repository = TestUserRepository(user())
    private val useCase = ChangeOwnPasswordUseCase(repository, encoder)

    @Test
    fun `every role can change own password and only the new password authenticates`() {
        for (role in UserRole.entries) {
            repository.user = user().copy(role = role)
            val before = repository.user

            useCase.change(before.toActor(), ChangePasswordDto("old-password", "new-password"))

            assertNotEquals("new-password", repository.user.passwordHash)
            assertTrue(encoder.matches("new-password", repository.user.passwordHash))
            assertFalse(encoder.matches("old-password", repository.user.passwordHash))
            assertEquals(before, repository.user.copy(passwordHash = before.passwordHash))
            val authenticate = AuthenticateUserUseCase(repository, encoder)
            assertEquals(before.id, authenticate.authenticate(before.email, "new-password").id)
            assertFailsWith<InvalidCredentialsException> {
                authenticate.authenticate(before.email, "old-password")
            }
        }
    }

    @Test
    fun `incorrect current password leaves the stored password unchanged`() {
        val before = repository.user

        assertFailsWith<InvalidCredentialsException> {
            useCase.change(before.toActor(), ChangePasswordDto("wrong-password", "new-password"))
        }

        assertEquals(0, repository.updates)
        assertEquals(before, repository.user)
    }

    @Test
    fun `current password exceeding the bcrypt byte limit is rejected without updating`() {
        assertFailsWith<InvalidCredentialsException> {
            useCase.change(repository.user.toActor(), ChangePasswordDto("\u00E9".repeat(37), "new-password"))
        }

        assertEquals(0, repository.updates)
    }

    @Test
    fun `invalid new passwords are rejected without updating`() {
        for (password in listOf("", "1234567", "a".repeat(73), "\u00E9".repeat(37))) {
            val ex = assertFailsWith<ValidationException> {
                useCase.change(repository.user.toActor(), ChangePasswordDto("old-password", password))
            }

            assertEquals(listOf("newPassword"), ex.errors.map { it.field })
        }
        assertEquals(0, repository.updates)
    }

    @Test
    fun `new passwords at the character and utf8 byte limits are accepted`() {
        for (password in listOf("12345678", "\u00E9".repeat(36))) {
            repository.user = user()

            useCase.change(repository.user.toActor(), ChangePasswordDto("old-password", password))

            assertTrue(encoder.matches(password, repository.user.passwordHash))
        }
    }

    @Test
    fun `password change preserves previously issued tokens`() {
        val secret = Base64.getEncoder().encodeToString(ByteArray(32) { it.toByte() })
        val provider = JwtTokenProvider(JwtProperties(secret, Duration.ofDays(30)))
        val token = provider.generate(repository.user)

        useCase.change(repository.user.toActor(), ChangePasswordDto("old-password", "new-password"))

        val resolver = JwtActorResolver(provider, GetUserUseCase(repository))
        assertEquals(repository.user.toActor(), resolver.resolve("Bearer $token"))
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

    private class TestUserRepository(var user: User) : UserRepository {
        var updates = 0

        override fun findById(id: UUID): User? = user.takeIf { it.id == id }

        override fun findByEmail(email: String): User? = user.takeIf { it.email == email }

        override fun update(id: UUID, dto: UpdateUserDto): User? {
            if (user.id != id) return null
            assertEquals(UpdateUserDto(passwordHash = dto.passwordHash), dto)
            updates++
            user = user.copy(passwordHash = requireNotNull(dto.passwordHash))
            return user
        }

        override fun create(dto: CreateUserDto): User = error("Not used")
        override fun findByPhone(phone: String): User? = error("Not used")
        override fun findAll(filter: UserFilter, pageRequest: PageRequest) = error("Not used")
        override fun deleteById(id: UUID): Boolean = error("Not used")
    }
}
