package com.bortnik.chiron.infrastructure.security

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.toActor
import com.bortnik.chiron.application.usecase.common.user.GetUserUseCase
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.infrastructure.security.jwt.JwtTokenProvider
import org.springframework.stereotype.Component
import java.util.UUID

// Shared by the HTTP filter and the STOMP CONNECT interceptor, so both authenticate the same way.
@Component
class JwtActorResolver(
    private val jwtTokenProvider: JwtTokenProvider,
    private val getUserUseCase: GetUserUseCase,
) {

    // Takes the value of an Authorization header; null for a missing, malformed or expired token or a deleted user.
    fun resolve(authorizationHeader: String?): Actor? =
        authorizationHeader
            ?.takeIf { it.startsWith(BEARER_PREFIX) }
            ?.let { jwtTokenProvider.parseUserId(it.removePrefix(BEARER_PREFIX)) }
            ?.let(::findUser)
            ?.toActor()

    // The user is reloaded on every request, so role changes and deletions take effect before the token expires.
    private fun findUser(id: UUID): User? =
        try {
            getUserUseCase.findById(id)
        } catch (e: UserNotFoundException) {
            null
        }

    private companion object {
        const val BEARER_PREFIX = "Bearer "
    }
}
