package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.specialization.AdminCreateSpecializationUseCase
import com.bortnik.chiron.application.usecase.admin.specialization.AdminDeleteSpecializationUseCase
import com.bortnik.chiron.application.usecase.admin.specialization.AdminUpdateSpecializationUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.specialization.CreateSpecializationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.specialization.UpdateSpecializationRequest
import com.bortnik.chiron.presentation.api.http.dto.response.SpecializationResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/admin/specializations")
@Tag(name = "Admin: Specializations")
class AdminSpecializationController(
    private val createSpecializationUseCase: AdminCreateSpecializationUseCase,
    private val updateSpecializationUseCase: AdminUpdateSpecializationUseCase,
    private val deleteSpecializationUseCase: AdminDeleteSpecializationUseCase,
) {
    @Operation(summary = "Create specialization")
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @Valid @RequestBody request: CreateSpecializationRequest,
    ): ResponseEntity<ApiResponse<SpecializationResponse>> =
        ApiResponse.created(createSpecializationUseCase.create(actor, request.toDto()).toResponse())

    @Operation(summary = "Update specialization")
    @PutMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateSpecializationRequest,
    ): ApiResponse<SpecializationResponse> =
        ApiResponse.success(updateSpecializationUseCase.update(actor, id, request.toDto()).toResponse())

    @Operation(summary = "Delete specialization")
    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteSpecializationUseCase.delete(actor, id)
        return ApiResponse.noContent()
    }
}
