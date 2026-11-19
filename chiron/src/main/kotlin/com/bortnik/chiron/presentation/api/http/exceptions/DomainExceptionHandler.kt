package com.bortnik.chiron.presentation.api.http.exceptions

import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import com.bortnik.chiron.domain.exceptions.ConflictException
import com.bortnik.chiron.domain.exceptions.DomainException
import com.bortnik.chiron.domain.exceptions.EntityAlreadyExistsException
import com.bortnik.chiron.domain.exceptions.EntityNotFoundException
import com.bortnik.chiron.domain.exceptions.InvalidCredentialsException
import com.bortnik.chiron.domain.exceptions.UnauthenticatedException
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.ApiViolation
import com.bortnik.chiron.presentation.api.http.mappers.toApiViolation
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

// Must run before GlobalExceptionHandler, otherwise its Exception fallback would swallow domain exceptions.
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice
class DomainExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(ValidationException::class)
    fun handleValidation(ex: ValidationException, request: HttpServletRequest): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.BAD_REQUEST, ex, request, ex.errors.map { it.toApiViolation() })

    @ExceptionHandler(EntityNotFoundException::class)
    fun handleNotFound(ex: EntityNotFoundException, request: HttpServletRequest): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.NOT_FOUND, ex, request)

    @ExceptionHandler(EntityAlreadyExistsException::class)
    fun handleAlreadyExists(
        ex: EntityAlreadyExistsException,
        request: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.CONFLICT, ex, request)

    @ExceptionHandler(ConflictException::class)
    fun handleConflict(ex: ConflictException, request: HttpServletRequest): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.CONFLICT, ex, request, ex.errors.takeIf { it.isNotEmpty() }?.map { it.toApiViolation() })

    @ExceptionHandler(BusinessRuleViolationException::class)
    fun handleBusinessRule(
        ex: BusinessRuleViolationException,
        request: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Nothing>> =
        respond(
            HttpStatus.UNPROCESSABLE_ENTITY,
            ex,
            request,
            ex.errors.takeIf { it.isNotEmpty() }?.map { it.toApiViolation() },
        )

    @ExceptionHandler(UnauthenticatedException::class, InvalidCredentialsException::class)
    fun handleUnauthenticated(
        ex: DomainException,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<ApiResponse<Nothing>> {
        if (ex is UnauthenticatedException) {
            response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer")
        }
        return respond(HttpStatus.UNAUTHORIZED, ex, request)
    }

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(ex: AccessDeniedException, request: HttpServletRequest): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.FORBIDDEN, ex, request)

    @ExceptionHandler(DomainException::class)
    fun handleDomain(ex: DomainException, request: HttpServletRequest): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.BAD_REQUEST, ex, request)

    private fun respond(
        status: HttpStatus,
        ex: DomainException,
        request: HttpServletRequest,
        violations: List<ApiViolation>? = null,
    ): ResponseEntity<ApiResponse<Nothing>> {
        log.warn("{} {} -> {} {}: {}", request.method, request.requestURI, status.value(), ex::class.simpleName, ex.message)
        return errorResponse(status, ex, request, violations = violations)
    }
}
