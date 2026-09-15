package com.bortnik.chiron.presentation.api.http.exceptions

import com.bortnik.chiron.presentation.api.http.ApiError
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.ApiViolation
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

fun errorResponse(
    status: HttpStatus,
    ex: Throwable,
    request: HttpServletRequest,
    message: String = ex.message ?: status.reasonPhrase,
    violations: List<ApiViolation>? = null,
): ResponseEntity<ApiResponse<Nothing>> = ApiResponse.error(
    status,
    ApiError(
        name = ex::class.simpleName ?: status.name,
        message = message,
        status = status,
        path = request.requestURI,
        violations = violations,
    ),
)
