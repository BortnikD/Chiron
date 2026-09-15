package com.bortnik.chiron.presentation.api.http

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import java.time.Instant

data class ApiResponse<T>(
    val success: Boolean = true,
    val result: T? = null,
    val error: ApiError? = null,
    val timestamp: Instant = Instant.now(),
) {
    companion object {
        fun <T> success(result: T): ApiResponse<T> =
            ApiResponse(result = result)

        fun <T> created(result: T): ResponseEntity<ApiResponse<T>> =
            ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse(result = result))

        fun noContent(): ResponseEntity<Nothing> =
            ResponseEntity.noContent().build()

        fun error(status: HttpStatus, error: ApiError): ResponseEntity<ApiResponse<Nothing>> =
            ResponseEntity.status(status).body(ApiResponse(success = false, error = error))
    }
}
