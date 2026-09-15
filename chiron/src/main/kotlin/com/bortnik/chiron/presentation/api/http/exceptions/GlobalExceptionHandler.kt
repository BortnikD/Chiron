package com.bortnik.chiron.presentation.api.http.exceptions

import com.bortnik.chiron.infrastructure.persistence.exceptions.ConcurrencyException
import com.bortnik.chiron.infrastructure.persistence.exceptions.ConnectionException
import com.bortnik.chiron.infrastructure.persistence.exceptions.ForeignKeyViolationException
import com.bortnik.chiron.infrastructure.persistence.exceptions.InvalidDataException
import com.bortnik.chiron.infrastructure.persistence.exceptions.PersistenceException
import com.bortnik.chiron.infrastructure.persistence.exceptions.QueryTimeoutException
import com.bortnik.chiron.infrastructure.persistence.exceptions.UniqueViolationException
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.ApiViolation
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.core.AuthenticationException
import org.springframework.web.HttpMediaTypeNotAcceptableException
import org.springframework.web.HttpMediaTypeNotSupportedException
import org.springframework.web.HttpRequestMethodNotSupportedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.ServletRequestBindingException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.HandlerMethodValidationException
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import org.springframework.web.server.ResponseStatusException
import org.springframework.web.servlet.NoHandlerFoundException
import org.springframework.web.servlet.resource.NoResourceFoundException
import com.bortnik.chiron.infrastructure.persistence.exceptions.ConstraintViolationException as DbConstraintViolationException
import jakarta.validation.ConstraintViolationException as BeanConstraintViolationException
import org.springframework.security.access.AccessDeniedException as SecurityAccessDeniedException

@Order(Ordered.LOWEST_PRECEDENCE)
@RestControllerAdvice
class GlobalExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(NoResourceFoundException::class, NoHandlerFoundException::class)
    fun handleNotFound(ex: Exception, request: HttpServletRequest): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.NOT_FOUND, ex, request, "Resource not found: ${request.method} ${request.requestURI}")

    @ExceptionHandler(HttpRequestMethodNotSupportedException::class)
    fun handleMethodNotSupported(
        ex: HttpRequestMethodNotSupportedException,
        request: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.METHOD_NOT_ALLOWED, ex, request, "Method ${ex.method} is not supported for this endpoint")

    @ExceptionHandler(HttpMediaTypeNotSupportedException::class)
    fun handleMediaTypeNotSupported(
        ex: HttpMediaTypeNotSupportedException,
        request: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ex, request, "Content type ${ex.contentType} is not supported")

    @ExceptionHandler(HttpMediaTypeNotAcceptableException::class)
    fun handleMediaTypeNotAcceptable(
        ex: HttpMediaTypeNotAcceptableException,
        request: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.NOT_ACCEPTABLE, ex, request, "Requested media type is not acceptable")

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleNotReadable(
        ex: HttpMessageNotReadableException,
        request: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.BAD_REQUEST, ex, request, "Request body is missing or malformed")

    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleTypeMismatch(
        ex: MethodArgumentTypeMismatchException,
        request: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.BAD_REQUEST, ex, request, "Parameter '${ex.name}' has invalid value '${ex.value}'")

    @ExceptionHandler(MissingServletRequestParameterException::class)
    fun handleMissingParameter(
        ex: MissingServletRequestParameterException,
        request: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.BAD_REQUEST, ex, request, "Required parameter '${ex.parameterName}' is missing")

    @ExceptionHandler(ServletRequestBindingException::class)
    fun handleBinding(
        ex: ServletRequestBindingException,
        request: HttpServletRequest
    ): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.BAD_REQUEST, ex, request)

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleArgumentNotValid(
        ex: MethodArgumentNotValidException,
        request: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Nothing>> {
        val violations = ex.bindingResult.fieldErrors.map { ApiViolation(it.field, it.defaultMessage ?: "is invalid") }
        return respond(HttpStatus.BAD_REQUEST, ex, request, "Validation failed", violations)
    }

    @ExceptionHandler(HandlerMethodValidationException::class)
    fun handleMethodValidation(
        ex: HandlerMethodValidationException,
        request: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Nothing>> {
        val violations = ex.parameterValidationResults.flatMap { result ->
            val field = result.methodParameter.parameterName ?: "parameter"
            result.resolvableErrors.map { ApiViolation(field, it.defaultMessage ?: "is invalid") }
        }
        return respond(HttpStatus.BAD_REQUEST, ex, request, "Validation failed", violations)
    }

    @ExceptionHandler(BeanConstraintViolationException::class)
    fun handleConstraintViolation(
        ex: BeanConstraintViolationException,
        request: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Nothing>> {
        val violations = ex.constraintViolations.map { ApiViolation(it.propertyPath.toString(), it.message) }
        return respond(HttpStatus.BAD_REQUEST, ex, request, "Validation failed", violations)
    }

    @ExceptionHandler(ResponseStatusException::class)
    fun handleResponseStatus(
        ex: ResponseStatusException,
        request: HttpServletRequest
    ): ResponseEntity<ApiResponse<Nothing>> {
        val status = HttpStatus.resolve(ex.statusCode.value()) ?: HttpStatus.INTERNAL_SERVER_ERROR
        return respond(status, ex, request, ex.reason ?: status.reasonPhrase)
    }

    @ExceptionHandler(AuthenticationException::class)
    fun handleAuthentication(
        ex: AuthenticationException,
        request: HttpServletRequest
    ): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.UNAUTHORIZED, ex, request, "Authentication required")

    @ExceptionHandler(SecurityAccessDeniedException::class)
    fun handleAccessDenied(
        ex: SecurityAccessDeniedException,
        request: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.FORBIDDEN, ex, request, "Access denied")

    // Database details (constraint, table, SQL state) are logged but never exposed to the client.
    @ExceptionHandler(PersistenceException::class)
    fun handlePersistence(ex: PersistenceException, request: HttpServletRequest): ResponseEntity<ApiResponse<Nothing>> {
        val (status, message) = when (ex) {
            is UniqueViolationException -> HttpStatus.CONFLICT to "Resource conflicts with an existing record"
            is ForeignKeyViolationException -> HttpStatus.CONFLICT to "Operation violates a reference to a related resource"
            is DbConstraintViolationException -> HttpStatus.BAD_REQUEST to "Data violates a storage constraint"
            is InvalidDataException -> HttpStatus.BAD_REQUEST to "Data has invalid format or is out of range"
            is ConcurrencyException -> HttpStatus.CONFLICT to "Resource was modified concurrently, retry the request"
            is QueryTimeoutException, is ConnectionException -> HttpStatus.SERVICE_UNAVAILABLE to "Storage is temporarily unavailable"
            else -> HttpStatus.INTERNAL_SERVER_ERROR to "Unexpected storage error"
        }
        return respond(status, ex, request, message)
    }

    @ExceptionHandler(Exception::class)
    fun handleUnexpected(ex: Exception, request: HttpServletRequest): ResponseEntity<ApiResponse<Nothing>> =
        respond(HttpStatus.INTERNAL_SERVER_ERROR, ex, request, "Internal server error")

    private fun respond(
        status: HttpStatus,
        ex: Exception,
        request: HttpServletRequest,
        message: String = ex.message ?: status.reasonPhrase,
        violations: List<ApiViolation>? = null,
    ): ResponseEntity<ApiResponse<Nothing>> {
        if (status.is5xxServerError) {
            log.error(
                "{} {} -> {} {}: {}",
                request.method,
                request.requestURI,
                status.value(),
                ex::class.simpleName,
                ex.message,
                ex
            )
        } else {
            log.error(
                "{} {} -> {} {}: {}",
                request.method,
                request.requestURI,
                status.value(),
                ex::class.simpleName,
                ex.message
            )
        }
        return errorResponse(status, ex, request, message, violations)
    }
}
