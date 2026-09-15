package com.bortnik.chiron.presentation.api.http.controllers

import com.bortnik.chiron.application.usecase.pet.CreatePetUseCase
import com.bortnik.chiron.application.usecase.pet.DeletePetUseCase
import com.bortnik.chiron.application.usecase.pet.GetPetUseCase
import com.bortnik.chiron.application.usecase.pet.UpdatePetUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.pet.CreatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pet.UpdatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.response.PetResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/pets")
@Tag(name = "Pets")
class PetController(
    private val createPetUseCase: CreatePetUseCase,
    private val getPetUseCase: GetPetUseCase,
    private val updatePetUseCase: UpdatePetUseCase,
    private val deletePetUseCase: DeletePetUseCase,
) {
    @Operation(summary = "List pets")
    @GetMapping
    fun findAll(
        @Parameter(description = "Return only pets of this owner")
        @RequestParam(required = false) ownerId: UUID?,
    ): ApiResponse<List<PetResponse>> {
        val pets = ownerId?.let { getPetUseCase.findAllByOwnerId(it) } ?: getPetUseCase.findAll()
        return ApiResponse.success(pets.map { it.toResponse() })
    }

    @Operation(summary = "Get pet by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<PetResponse> =
        ApiResponse.success(getPetUseCase.findById(id).toResponse())

    @Operation(summary = "Create pet")
    @PostMapping
    fun create(@RequestBody request: CreatePetRequest): ResponseEntity<ApiResponse<PetResponse>> =
        ApiResponse.created(createPetUseCase.create(request.toDto()).toResponse())

    @Operation(
        summary = "Update pet",
        description = "Setting isArchived to true keeps the pet's history but forbids booking new appointments for it.",
    )
    @PutMapping("/{id}")
    fun update(@PathVariable id: UUID, @RequestBody request: UpdatePetRequest): ApiResponse<PetResponse> =
        ApiResponse.success(updatePetUseCase.update(id, request.toDto()).toResponse())

    @Operation(summary = "Delete pet")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Nothing> {
        deletePetUseCase.delete(id)
        return ApiResponse.noContent()
    }
}
