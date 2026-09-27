package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.user.GetUserUseCase
import com.bortnik.chiron.application.usecase.common.user.UpdateOwnProfileUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.user.UpdateUserRequest
import com.bortnik.chiron.presentation.api.http.dto.response.UserResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users")
class UserController(
    private val getUserUseCase: GetUserUseCase,
    private val updateOwnProfileUseCase: UpdateOwnProfileUseCase,
) {
    @Operation(summary = "Get current user")
    @GetMapping("/me")
    fun me(@AuthenticationPrincipal actor: Actor): ApiResponse<UserResponse> =
        ApiResponse.success(getUserUseCase.findById(actor.userId).toResponse())

    @Operation(
        summary = "Update current user",
        description = "Available to every role. fullName is rebuilt by the server as \"I. M. Lastname\".",
    )
    @PatchMapping("/me")
    fun updateMe(
        @AuthenticationPrincipal actor: Actor,
        @Valid @RequestBody request: UpdateUserRequest,
    ): ApiResponse<UserResponse> =
        ApiResponse.success(updateOwnProfileUseCase.update(actor, request.toDto()).toResponse())
}
