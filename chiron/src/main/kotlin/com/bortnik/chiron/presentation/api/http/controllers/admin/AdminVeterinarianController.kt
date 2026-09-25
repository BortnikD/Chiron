package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.veterinarian.AdminCreateVeterinarianUseCase
import com.bortnik.chiron.application.usecase.admin.veterinarian.AdminDeleteVeterinarianUseCase
import com.bortnik.chiron.application.usecase.admin.veterinarian.AdminGetVeterinarianUseCase
import com.bortnik.chiron.application.usecase.admin.veterinarian.AdminUpdateVeterinarianUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.CreateVeterinarianRequest
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.UpdateVeterinarianRequest
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.VeterinarianFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianResponse
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
@RequestMapping("/api/v1/admin/veterinarians")
@Tag(name = "Admin: Veterinarians")
class AdminVeterinarianController(
    private val createVeterinarianUseCase: AdminCreateVeterinarianUseCase,
    private val getVeterinarianUseCase: AdminGetVeterinarianUseCase,
    private val updateVeterinarianUseCase: AdminUpdateVeterinarianUseCase,
    private val deleteVeterinarianUseCase: AdminDeleteVeterinarianUseCase,
) {
    @Operation(
        summary = "List veterinarians, including inactive ones",
        description = "All filters are optional and combined with AND. Sorted by creation time ascending.",
    )
    @GetMapping
    fun findAll(
        @ParameterObject filter: VeterinarianFilterRequest,
    ): ApiResponse<List<VeterinarianResponse>> =
        ApiResponse.success(getVeterinarianUseCase.findAll(filter.toDto()).map { it.toResponse() })

    @Operation(summary = "Get veterinarian profile by user id")
    @GetMapping("/by-user/{userId}")
    fun findByUserId(
        @PathVariable userId: UUID,
    ): ApiResponse<VeterinarianResponse> =
        ApiResponse.success(getVeterinarianUseCase.findByUserId(userId).toResponse())

    @Operation(
        summary = "Create veterinarian profile",
        description = "The referenced user must have the VETERINARIAN role and may own only one veterinarian profile.",
    )
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @Valid @RequestBody request: CreateVeterinarianRequest,
    ): ResponseEntity<ApiResponse<VeterinarianResponse>> =
        ApiResponse.created(createVeterinarianUseCase.create(actor, request.toDto()).toResponse())

    @Operation(summary = "Update veterinarian profile")
    @PatchMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateVeterinarianRequest,
    ): ApiResponse<VeterinarianResponse> =
        ApiResponse.success(updateVeterinarianUseCase.update(actor, id, request.toDto()).toResponse())

    @Operation(summary = "Delete veterinarian profile")
    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteVeterinarianUseCase.delete(actor, id)
        return ApiResponse.noContent()
    }
}
