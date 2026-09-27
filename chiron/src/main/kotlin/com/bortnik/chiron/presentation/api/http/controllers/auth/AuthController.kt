package com.bortnik.chiron.presentation.api.http.controllers.auth

import com.bortnik.chiron.application.usecase.common.auth.AuthenticateUserUseCase
import com.bortnik.chiron.application.usecase.common.user.RegisterUserUseCase
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.infrastructure.security.jwt.JwtTokenProvider
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.auth.LoginRequest
import com.bortnik.chiron.presentation.api.http.dto.request.auth.RegisterRequest
import com.bortnik.chiron.presentation.api.http.dto.response.AuthResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/auth")
@Tag(
    name = "Auth",
    description = """
        Issues a JWT access token that is valid for 30 days; there is no refresh token.
        Send it as `Authorization: Bearer <token>`.
    """,
)
class AuthController(
    private val registerUserUseCase: RegisterUserUseCase,
    private val authenticateUserUseCase: AuthenticateUserUseCase,
    private val jwtTokenProvider: JwtTokenProvider,
) {
    @Operation(
        summary = "Register client",
        description = "Always creates a CLIENT. Veterinarians and admins are created by an admin.",
    )
    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<ApiResponse<AuthResponse>> =
        ApiResponse.created(registerUserUseCase.register(request.toDto()).toAuthResponse())

    @Operation(summary = "Log in with email and password")
    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ApiResponse<AuthResponse> =
        ApiResponse.success(authenticateUserUseCase.authenticate(request.email, request.password).toAuthResponse())

    private fun User.toAuthResponse(): AuthResponse =
        AuthResponse(accessToken = jwtTokenProvider.generate(this), user = toResponse())
}
