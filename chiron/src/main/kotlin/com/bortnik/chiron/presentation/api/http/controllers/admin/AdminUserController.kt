package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.usecase.user.DeleteUserUseCase
import com.bortnik.chiron.application.usecase.user.GetUserUseCase
import com.bortnik.chiron.application.usecase.user.RegisterUserUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.user.CreateUserRequest
import com.bortnik.chiron.presentation.api.http.dto.response.UserResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
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
    private val registerUserUseCase: RegisterUserUseCase,
    private val getUserUseCase: GetUserUseCase,
    private val deleteUserUseCase: DeleteUserUseCase,
) {
    @Operation(summary = "List all users")
    @GetMapping
    fun findAll(): ApiResponse<List<UserResponse>> =
        ApiResponse.success(getUserUseCase.findAll().map { it.toResponse() })

    @Operation(summary = "Get user by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<UserResponse> =
        ApiResponse.success(getUserUseCase.findById(id).toResponse())

    @Operation(summary = "Get user by email")
    @GetMapping("/by-email")
    fun findByEmail(@RequestParam email: String): ApiResponse<UserResponse> =
        ApiResponse.success(getUserUseCase.findByEmail(email).toResponse())

    @Operation(summary = "Get user by phone")
    @GetMapping("/by-phone")
    fun findByPhone(@RequestParam phone: String): ApiResponse<UserResponse> =
        ApiResponse.success(getUserUseCase.findByPhone(phone).toResponse())

    @Operation(
        summary = "Create user with any role",
        description = "The only way to create veterinarians and admins; public registration always creates a CLIENT.",
    )
    @PostMapping
    fun create(@RequestBody request: CreateUserRequest): ResponseEntity<ApiResponse<UserResponse>> =
        ApiResponse.created(registerUserUseCase.register(request.toDto()).toResponse())

    @Operation(summary = "Delete user")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteUserUseCase.delete(id)
        return ApiResponse.noContent()
    }
}
