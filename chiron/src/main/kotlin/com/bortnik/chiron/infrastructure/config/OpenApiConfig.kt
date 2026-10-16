package com.bortnik.chiron.infrastructure.config

import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
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

                    Updates use PATCH: fields missing from the body keep their values,
                    an explicit `null` clears a nullable field.

                    Authentication: obtain a token via `/api/v1/auth/login` or `/api/v1/auth/register`
                    and send it as `Authorization: Bearer <token>`.
                    Endpoints under `/api/v1/admin` require ADMIN, `/api/v1/veterinarian` require VETERINARIAN,
                    `/api/v1/client` require CLIENT. Catalog reads under `/api/v1` are public.

                    Interactive references: [Scalar](/scalar.html) and [Swagger UI](/swagger-ui.html).
                    """.trimIndent(),
                ),
        )
        .components(
            Components().addSecuritySchemes(
                BEARER_AUTH,
                SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT"),
            ),
        )
        .addSecurityItem(SecurityRequirement().addList(BEARER_AUTH))

    private companion object {
        const val BEARER_AUTH = "bearerAuth"
    }
}
