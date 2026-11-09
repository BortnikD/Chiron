package com.bortnik.chiron.infrastructure.logging

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import kotlin.time.TimeSource

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class RequestLoggingFilter : OncePerRequestFilter() {
    private val log = LoggerFactory.getLogger(javaClass)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val started = TimeSource.Monotonic.markNow()
        // The servlet container sets the error status only after an unhandled exception leaves the filter.
        var status = HttpServletResponse.SC_INTERNAL_SERVER_ERROR
        try {
            filterChain.doFilter(request, response)
            status = response.status
        } finally {
            log.info(
                "{} {} -> {} ({} ms)",
                request.method,
                request.requestURI,
                status,
                started.elapsedNow().inWholeMilliseconds,
            )
        }
    }
}
