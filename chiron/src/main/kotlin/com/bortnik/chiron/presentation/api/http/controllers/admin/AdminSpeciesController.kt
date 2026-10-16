package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.species.AdminCreateSpeciesUseCase
import com.bortnik.chiron.application.usecase.admin.species.AdminDeleteSpeciesUseCase
import com.bortnik.chiron.application.usecase.admin.species.AdminUpdateSpeciesUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.species.CreateSpeciesRequest
import com.bortnik.chiron.presentation.api.http.dto.request.species.UpdateSpeciesRequest
import com.bortnik.chiron.presentation.api.http.dto.response.SpeciesResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/admin/species")
@Tag(name = "Admin: Species")
class AdminSpeciesController(
    private val createSpeciesUseCase: AdminCreateSpeciesUseCase,
    private val updateSpeciesUseCase: AdminUpdateSpeciesUseCase,
    private val deleteSpeciesUseCase: AdminDeleteSpeciesUseCase,
) {
    @Operation(summary = "Create species")
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @Valid @RequestBody request: CreateSpeciesRequest,
    ): ResponseEntity<ApiResponse<SpeciesResponse>> =
        ApiResponse.created(createSpeciesUseCase.create(actor, request.toDto()).toResponse())

    @Operation(summary = "Update species")
    @PatchMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateSpeciesRequest,
    ): ApiResponse<SpeciesResponse> =
        ApiResponse.success(updateSpeciesUseCase.update(actor, id, request.toDto()).toResponse())

    @Operation(summary = "Delete species")
    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteSpeciesUseCase.delete(actor, id)
        return ApiResponse.noContent()
    }
}
