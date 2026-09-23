package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.user.AdminCreateUserUseCase
import com.bortnik.chiron.application.usecase.admin.user.AdminDeleteUserUseCase
import com.bortnik.chiron.application.usecase.admin.user.AdminGetUserUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.user.CreateUserRequest
import com.bortnik.chiron.presentation.api.http.dto.response.UserResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/admin/users")
@Tag(name = "Admin: Users")
class AdminUserController(
    private val createUserUseCase: AdminCreateUserUseCase,
    private val getUserUseCase: AdminGetUserUseCase,
    private val deleteUserUseCase: AdminDeleteUserUseCase,
) {
    @Operation(summary = "List all users")
    @GetMapping
    fun findAll(@AuthenticationPrincipal actor: Actor): ApiResponse<List<UserResponse>> =
        ApiResponse.success(getUserUseCase.findAll(actor).map { it.toResponse() })

    @Operation(summary = "Get user by id")
    @GetMapping("/{id}")
    fun findById(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ApiResponse<UserResponse> =
        ApiResponse.success(getUserUseCase.findById(actor, id).toResponse())

    @Operation(summary = "Get user by email")
    @GetMapping("/by-email")
    fun findByEmail(@AuthenticationPrincipal actor: Actor, @RequestParam email: String): ApiResponse<UserResponse> =
        ApiResponse.success(getUserUseCase.findByEmail(actor, email).toResponse())

    @Operation(summary = "Get user by phone")
    @GetMapping("/by-phone")
    fun findByPhone(@AuthenticationPrincipal actor: Actor, @RequestParam phone: String): ApiResponse<UserResponse> =
        ApiResponse.success(getUserUseCase.findByPhone(actor, phone).toResponse())

    @Operation(
        summary = "Create user with any role",
        description = "The only way to create veterinarians and admins; public registration always creates a CLIENT.",
    )
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @RequestBody request: CreateUserRequest,
    ): ResponseEntity<ApiResponse<UserResponse>> =
        ApiResponse.created(createUserUseCase.create(actor, request.toDto()).toResponse())

    @Operation(summary = "Delete user")
    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteUserUseCase.delete(actor, id)
        return ApiResponse.noContent()
    }
}
