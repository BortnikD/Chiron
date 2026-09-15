package com.bortnik.chiron.infrastructure.security.jwt

import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.entities.enums.UserRole
import org.junit.jupiter.api.Test
import java.time.Duration
import java.time.Instant
import java.util.Base64
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNull

class JwtTokenProviderTest {

    private val provider = provider(secret(seed = 1), Duration.ofDays(30))

    @Test
    fun `generated token resolves to the user id`() {
        val user = user()

        assertEquals(user.id, provider.parseUserId(provider.generate(user)))
    }

    @Test
    fun `expired token is rejected`() {
        val expiredProvider = provider(secret(seed = 1), Duration.ofSeconds(-1))

        assertNull(provider.parseUserId(expiredProvider.generate(user())))
    }

    @Test
    fun `token signed with another key is rejected`() {
        val foreignProvider = provider(secret(seed = 2), Duration.ofDays(30))

        assertNull(provider.parseUserId(foreignProvider.generate(user())))
    }

    @Test
    fun `malformed token is rejected`() {
        assertNull(provider.parseUserId("not-a-jwt"))
        assertNull(provider.parseUserId(""))
    }

    private fun provider(secret: String, ttl: Duration) = JwtTokenProvider(JwtProperties(secret, ttl))

    private fun secret(seed: Int): String = Base64.getEncoder().encodeToString(ByteArray(32) { (it + seed).toByte() })

    private fun user() = User(
        id = UUID.randomUUID(),
        email = "client@example.com",
        passwordHash = "hash",
        firstName = "Ivan",
        lastName = "Petrov",
        fullName = "Petrov Ivan",
        phone = "+79990000000",
        role = UserRole.CLIENT,
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
    )
}
