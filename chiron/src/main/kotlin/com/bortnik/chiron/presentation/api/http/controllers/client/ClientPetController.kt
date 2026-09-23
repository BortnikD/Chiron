package com.bortnik.chiron.presentation.api.http.controllers.client

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.client.pet.ClientCreatePetUseCase
import com.bortnik.chiron.application.usecase.client.pet.ClientDeletePetUseCase
import com.bortnik.chiron.application.usecase.client.pet.ClientGetPetUseCase
import com.bortnik.chiron.application.usecase.client.pet.ClientUpdatePetUseCase
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
    private val createPetUseCase: ClientCreatePetUseCase,
    private val getPetUseCase: ClientGetPetUseCase,
    private val updatePetUseCase: ClientUpdatePetUseCase,
    private val deletePetUseCase: ClientDeletePetUseCase,
) {
    @Operation(summary = "List own pets")
    @GetMapping
    fun findAll(@AuthenticationPrincipal actor: Actor): ApiResponse<List<PetResponse>> =
        ApiResponse.success(getPetUseCase.findAll(actor).map { it.toResponse() })

    @Operation(summary = "Get own pet by id")
    @GetMapping("/{id}")
    fun findById(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ApiResponse<PetResponse> =
        ApiResponse.success(getPetUseCase.findById(actor, id).toResponse())

    @Operation(summary = "Create pet owned by the current user")
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @RequestBody request: ClientCreatePetRequest,
    ): ResponseEntity<ApiResponse<PetResponse>> =
        ApiResponse.created(createPetUseCase.create(actor, request.toDto()).toResponse())

    @Operation(
        summary = "Update own pet",
        description = "Setting isArchived to true keeps the pet's history but forbids booking new appointments for it.",
    )
    @PutMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @RequestBody request: UpdatePetRequest,
    ): ApiResponse<PetResponse> =
        ApiResponse.success(updatePetUseCase.update(actor, id, request.toDto()).toResponse())

    @Operation(summary = "Delete own pet")
    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        deletePetUseCase.delete(actor, id)
        return ApiResponse.noContent()
    }
}
