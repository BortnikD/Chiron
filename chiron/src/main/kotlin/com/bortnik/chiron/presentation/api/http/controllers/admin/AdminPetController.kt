package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.pet.AdminCreatePetUseCase
import com.bortnik.chiron.application.usecase.admin.pet.AdminDeletePetUseCase
import com.bortnik.chiron.application.usecase.admin.pet.AdminGetPetUseCase
import com.bortnik.chiron.application.usecase.admin.pet.AdminUpdatePetUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.pet.CreatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pet.UpdatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.response.PetResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/admin/pets")
@Tag(name = "Admin: Pets")
class AdminPetController(
    private val createPetUseCase: AdminCreatePetUseCase,
    private val getPetUseCase: AdminGetPetUseCase,
    private val updatePetUseCase: AdminUpdatePetUseCase,
    private val deletePetUseCase: AdminDeletePetUseCase,
) {
    @Operation(summary = "List pets")
    @GetMapping
    fun findAll(
        @AuthenticationPrincipal actor: Actor,
        @Parameter(description = "Return only pets of this owner")
        @RequestParam(required = false) ownerId: UUID?,
    ): ApiResponse<List<PetResponse>> {
        val pets = ownerId?.let { getPetUseCase.findAllByOwnerId(actor, it) } ?: getPetUseCase.findAll(actor)
        return ApiResponse.success(pets.map { it.toResponse() })
    }

    @Operation(summary = "Get pet by id")
    @GetMapping("/{id}")
    fun findById(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ApiResponse<PetResponse> =
        ApiResponse.success(getPetUseCase.findById(actor, id).toResponse())

    @Operation(summary = "Create pet for any owner")
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @Valid @RequestBody request: CreatePetRequest,
    ): ResponseEntity<ApiResponse<PetResponse>> =
        ApiResponse.created(createPetUseCase.create(actor, request.toDto()).toResponse())

    @Operation(
        summary = "Update pet",
        description = "Setting isArchived to true keeps the pet's history but forbids booking new appointments for it.",
    )
    @PatchMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdatePetRequest,
    ): ApiResponse<PetResponse> =
        ApiResponse.success(updatePetUseCase.update(actor, id, request.toDto()).toResponse())

    @Operation(summary = "Delete pet")
    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        deletePetUseCase.delete(actor, id)
        return ApiResponse.noContent()
    }
}
