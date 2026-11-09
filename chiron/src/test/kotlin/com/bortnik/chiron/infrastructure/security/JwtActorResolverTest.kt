package com.bortnik.chiron.infrastructure.security

import com.bortnik.chiron.application.security.toActor
import com.bortnik.chiron.application.usecase.common.user.GetUserUseCase
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.infrastructure.security.jwt.JwtProperties
import com.bortnik.chiron.infrastructure.security.jwt.JwtTokenProvider
import com.bortnik.chiron.support.TestEntities.user
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.time.Duration
import java.util.Base64
import kotlin.test.assertEquals
import kotlin.test.assertNull

class JwtActorResolverTest {
    private val repository = mock(UserRepository::class.java)
    private val secret = Base64.getEncoder().encodeToString(ByteArray(32) { it.toByte() })
    private val provider = JwtTokenProvider(JwtProperties(secret, Duration.ofDays(1)))
    private val resolver = JwtActorResolver(provider, GetUserUseCase(repository))

    @Test
    fun `missing malformed and expired authorization do not load a user`() {
        val expired = JwtTokenProvider(JwtProperties(secret, Duration.ofSeconds(-10))).generate(user)
        for (header in listOf(
            null,
            "",
            "Basic token",
            "bearer token",
            "Bearer ",
            "Bearer invalid",
            "Bearer $expired"
        )) {
            assertNull(resolver.resolve(header))
        }
        verifyNoInteractions(repository)
    }

    @Test
    fun `deleted user cannot authenticate with a valid token`() {
        assertNull(resolver.resolve("Bearer ${provider.generate(user)}"))
    }

    @Test
    fun `each resolution uses current role and profile values rather than issued token claims`() {
        val token = "Bearer ${provider.generate(user)}"
        `when`(repository.findById(user.id)).thenReturn(
            user,
            user.copy(role = UserRole.ADMIN, fullName = "Updated name"),
            null
        )
        assertEquals(user.toActor(), resolver.resolve(token))
        assertEquals(user.copy(role = UserRole.ADMIN, fullName = "Updated name").toActor(), resolver.resolve(token))
        assertNull(resolver.resolve(token))
    }
}
