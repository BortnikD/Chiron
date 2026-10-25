package com.bortnik.chiron.infrastructure.security

import com.bortnik.chiron.application.security.Actor
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter

// Not a Spring bean on purpose: Boot would otherwise register it a second time as a plain servlet filter.
class JwtAuthenticationFilter(
    private val jwtActorResolver: JwtActorResolver,
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val actor = jwtActorResolver.resolve(request.getHeader(HttpHeaders.AUTHORIZATION))

        if (actor != null) {
            SecurityContextHolder.getContext().authentication =
                UsernamePasswordAuthenticationToken.authenticated(actor, null, authorities(actor))
        }
        filterChain.doFilter(request, response)
    }

    private fun authorities(actor: Actor): List<SimpleGrantedAuthority> =
        listOf(SimpleGrantedAuthority("ROLE_${actor.role.name}"))
}
