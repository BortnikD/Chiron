package com.bortnik.chiron.presentation.api.http.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {

    @Bean
    fun chironOpenApi(): OpenAPI = OpenAPI()
        .info(
            Info()
                .title("Chiron API")
                .version("v1")
                .description(
                    """
                    REST API of the Chiron veterinary clinic.

                    Every response body is wrapped into ApiResponse: `success`, `result`, `error`, `timestamp`.
                    On failure `error` holds the exception name, message, HTTP status, request path
                    and, for validation errors, the list of field violations.

                    Interactive references: [Scalar](/scalar.html) and [Swagger UI](/swagger-ui.html).
                    """.trimIndent(),
                ),
        )
}
