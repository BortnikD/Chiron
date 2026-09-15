package com.bortnik.chiron.infrastructure.security

import com.bortnik.chiron.application.usecase.user.GetUserUseCase
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.infrastructure.security.jwt.JwtTokenProvider
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
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
            val principal = user.toAuthenticatedUser()
            SecurityContextHolder.getContext().authentication =
                UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.authorities)
        }
        filterChain.doFilter(request, response)
    }

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
