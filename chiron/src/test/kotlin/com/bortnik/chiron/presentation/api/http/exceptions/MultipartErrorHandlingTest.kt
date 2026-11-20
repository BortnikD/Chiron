package com.bortnik.chiron.presentation.api.http.exceptions

import org.apache.tomcat.util.http.fileupload.FileUploadException
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.web.multipart.MaxUploadSizeExceededException
import org.springframework.web.multipart.MultipartException
import java.io.IOException
import kotlin.test.assertEquals

class MultipartErrorHandlingTest {
    private val request = MockHttpServletRequest("PUT", "/api/v1/veterinarian/profile/photo")

    @Test
    fun `malformed upload returns 400 but filesystem and size failures keep their own statuses`() {
        val handler = GlobalExceptionHandler()
        val malformed = MultipartException("Parse failed", FileUploadException("No multipart boundary"))
        val ioFailure = MultipartException("Parse failed", IOException("Cannot write temporary file"))

        assertEquals(400, handler.handleMultipart(malformed, request).statusCode.value())
        assertEquals(500, handler.handleMultipart(ioFailure, request).statusCode.value())
        assertEquals(
            413,
            PhotoExceptionHandler().tooLarge(MaxUploadSizeExceededException(5L * 1024 * 1024), request)
                .statusCode.value(),
        )
    }
}
