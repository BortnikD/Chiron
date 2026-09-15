package com.bortnik.chiron.presentation.api.http.exceptions

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.stereotype.Component
import tools.jackson.databind.json.JsonMapper

// Security rejects requests before they reach controllers, so @RestControllerAdvice cannot format these errors.
@Component
class RestSecurityErrorHandler(private val jsonMapper: JsonMapper) : AuthenticationEntryPoint, AccessDeniedHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException,
    ) = write(HttpStatus.UNAUTHORIZED, authException, request, response, "Authentication required")

    override fun handle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        accessDeniedException: AccessDeniedException,
    ) = write(HttpStatus.FORBIDDEN, accessDeniedException, request, response, "Access denied")

    private fun write(
        status: HttpStatus,
        ex: Exception,
        request: HttpServletRequest,
        response: HttpServletResponse,
        message: String,
    ) {
        log.warn("{} {} -> {} {}: {}", request.method, request.requestURI, status.value(), ex::class.simpleName, ex.message)
        response.status = status.value()
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        jsonMapper.writeValue(response.outputStream, errorResponse(status, ex, request, message).body)
    }
}
