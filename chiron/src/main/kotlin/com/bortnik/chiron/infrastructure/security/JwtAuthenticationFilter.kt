package com.bortnik.chiron.infrastructure.security

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.toActor
import com.bortnik.chiron.application.usecase.common.user.GetUserUseCase
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.infrastructure.security.jwt.JwtTokenProvider
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

// Not a Spring bean on purpose: Boot would otherwise register it a second time as a plain servlet filter.
class JwtAuthenticationFilter(
    private val jwtTokenProvider: JwtTokenProvider,
    private val getUserUseCase: GetUserUseCase,
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val user = request.getHeader(HttpHeaders.AUTHORIZATION)
            ?.takeIf { it.startsWith(BEARER_PREFIX) }
            ?.let { jwtTokenProvider.parseUserId(it.removePrefix(BEARER_PREFIX)) }
            ?.let(::findUser)

        if (user != null) {
            val actor = user.toActor()
            SecurityContextHolder.getContext().authentication =
                UsernamePasswordAuthenticationToken.authenticated(actor, null, authorities(actor))
        }
        filterChain.doFilter(request, response)
    }

    private fun authorities(actor: Actor): List<SimpleGrantedAuthority> =
        listOf(SimpleGrantedAuthority("ROLE_${actor.role.name}"))

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
