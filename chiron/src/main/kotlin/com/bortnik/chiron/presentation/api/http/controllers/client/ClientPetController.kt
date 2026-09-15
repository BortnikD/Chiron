package com.bortnik.chiron.presentation.api.http.controllers.client

import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.pet.CreatePetUseCase
import com.bortnik.chiron.application.usecase.pet.DeletePetUseCase
import com.bortnik.chiron.application.usecase.pet.GetPetUseCase
import com.bortnik.chiron.application.usecase.pet.UpdatePetUseCase
import com.bortnik.chiron.infrastructure.security.AuthenticatedUser
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.pet.ClientCreatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pet.UpdatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.response.PetResponse
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
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/client/pets")
@Tag(name = "Client: Pets")
class ClientPetController(
    private val createPetUseCase: CreatePetUseCase,
    private val getPetUseCase: GetPetUseCase,
    private val updatePetUseCase: UpdatePetUseCase,
    private val deletePetUseCase: DeletePetUseCase,
    private val accessGuard: ResourceAccessGuard,
) {
    @Operation(summary = "List own pets")
    @GetMapping
    fun findAll(@AuthenticationPrincipal user: AuthenticatedUser): ApiResponse<List<PetResponse>> =
        ApiResponse.success(getPetUseCase.findAllByOwnerId(user.id).map { it.toResponse() })

    @Operation(summary = "Get own pet by id")
    @GetMapping("/{id}")
    fun findById(@AuthenticationPrincipal user: AuthenticatedUser, @PathVariable id: UUID): ApiResponse<PetResponse> =
        ApiResponse.success(accessGuard.requireOwnedPet(user.id, id).toResponse())

    @Operation(summary = "Create pet owned by the current user")
    @PostMapping
    fun create(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @RequestBody request: ClientCreatePetRequest,
    ): ResponseEntity<ApiResponse<PetResponse>> =
        ApiResponse.created(createPetUseCase.create(request.toDto(ownerId = user.id)).toResponse())

    @Operation(
        summary = "Update own pet",
        description = "Setting isArchived to true keeps the pet's history but forbids booking new appointments for it.",
    )
    @PutMapping("/{id}")
    fun update(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID,
        @RequestBody request: UpdatePetRequest,
    ): ApiResponse<PetResponse> {
        accessGuard.requireOwnedPet(user.id, id)
        return ApiResponse.success(updatePetUseCase.update(id, request.toDto()).toResponse())
    }

    @Operation(summary = "Delete own pet")
    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal user: AuthenticatedUser, @PathVariable id: UUID): ResponseEntity<Nothing> {
        accessGuard.requireOwnedPet(user.id, id)
        deletePetUseCase.delete(id)
        return ApiResponse.noContent()
    }
}
