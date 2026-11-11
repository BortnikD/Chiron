package com.bortnik.chiron.presentation.api.http.exceptions

import com.bortnik.chiron.application.photo.PhotoStorageException
import jakarta.servlet.http.HttpServletRequest
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.multipart.MaxUploadSizeExceededException
import org.springframework.web.multipart.support.MissingServletRequestPartException

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
class PhotoExceptionHandler {
    @ExceptionHandler(PhotoStorageException::class)
    fun unavailable(ex: PhotoStorageException, request: HttpServletRequest) =
        errorResponse(HttpStatus.SERVICE_UNAVAILABLE, ex, request, "Photo storage is temporarily unavailable")

    @ExceptionHandler(MaxUploadSizeExceededException::class)
    fun tooLarge(ex: MaxUploadSizeExceededException, request: HttpServletRequest) =
        errorResponse(HttpStatus.PAYLOAD_TOO_LARGE, ex, request, "Photo must be at most 5 MB")

    @ExceptionHandler(MissingServletRequestPartException::class)
    fun missing(ex: MissingServletRequestPartException, request: HttpServletRequest) =
        errorResponse(HttpStatus.BAD_REQUEST, ex, request, "A file part is required")
}
