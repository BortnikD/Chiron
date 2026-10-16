package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.user.AdminCreateUserUseCase
import com.bortnik.chiron.application.usecase.admin.user.AdminDeleteUserUseCase
import com.bortnik.chiron.application.usecase.admin.user.AdminGetUserUseCase
import com.bortnik.chiron.application.usecase.admin.user.AdminUpdateUserUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.pagination.PaginationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.user.CreateUserRequest
import com.bortnik.chiron.presentation.api.http.dto.request.user.UpdateUserRequest
import com.bortnik.chiron.presentation.api.http.dto.request.user.UserFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.response.PageResponse
import com.bortnik.chiron.presentation.api.http.dto.response.UserResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/admin/users")
@Tag(name = "Admin: Users")
class AdminUserController(
    private val createUserUseCase: AdminCreateUserUseCase,
    private val getUserUseCase: AdminGetUserUseCase,
    private val updateUserUseCase: AdminUpdateUserUseCase,
    private val deleteUserUseCase: AdminDeleteUserUseCase,
) {
    @Operation(
        summary = "List users",
        description = "All filters are optional and combined with AND. Sorted by registration time ascending.",
    )
    @GetMapping
    fun findAll(
        @Valid @ParameterObject filter: UserFilterRequest,
        @Valid @ParameterObject pagination: PaginationRequest,
    ): ApiResponse<PageResponse<UserResponse>> =
        ApiResponse.success(
            getUserUseCase.findAll(filter.toDto(), pagination.toDto()).toResponse { it.toResponse() },
        )

    @Operation(summary = "Get user by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<UserResponse> =
        ApiResponse.success(getUserUseCase.findById(id).toResponse())

    @Operation(
        summary = "Create user with any role",
        description = "The only way to create veterinarians and admins; public registration always creates a CLIENT.",
    )
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @Valid @RequestBody request: CreateUserRequest,
    ): ResponseEntity<ApiResponse<UserResponse>> =
        ApiResponse.created(createUserUseCase.create(actor, request.toDto()).toResponse())

    @Operation(
        summary = "Update user",
        description = "Personal data of any user. fullName is rebuilt by the server as \"I. M. Lastname\".",
    )
    @PatchMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateUserRequest,
    ): ApiResponse<UserResponse> =
        ApiResponse.success(updateUserUseCase.update(actor, id, request.toDto()).toResponse())

    @Operation(summary = "Delete user")
    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteUserUseCase.delete(actor, id)
        return ApiResponse.noContent()
    }
}
