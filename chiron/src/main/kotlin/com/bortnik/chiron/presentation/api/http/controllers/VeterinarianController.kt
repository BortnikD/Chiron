package com.bortnik.chiron.presentation.api.http.controllers

import com.bortnik.chiron.application.usecase.veterinarian.CreateVeterinarianUseCase
import com.bortnik.chiron.application.usecase.veterinarian.DeleteVeterinarianUseCase
import com.bortnik.chiron.application.usecase.veterinarian.GetVeterinarianUseCase
import com.bortnik.chiron.application.usecase.veterinarian.UpdateVeterinarianUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.CreateVeterinarianRequest
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.UpdateVeterinarianRequest
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
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
@RequestMapping("/api/v1/veterinarians")
@Tag(name = "Veterinarians")
class VeterinarianController(
    private val createVeterinarianUseCase: CreateVeterinarianUseCase,
    private val getVeterinarianUseCase: GetVeterinarianUseCase,
    private val updateVeterinarianUseCase: UpdateVeterinarianUseCase,
    private val deleteVeterinarianUseCase: DeleteVeterinarianUseCase,
) {
    @Operation(summary = "List all veterinarians")
    @GetMapping
    fun findAll(): ApiResponse<List<VeterinarianResponse>> =
        ApiResponse.success(getVeterinarianUseCase.findAll().map { it.toResponse() })

    @Operation(summary = "Get veterinarian by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<VeterinarianResponse> =
        ApiResponse.success(getVeterinarianUseCase.findById(id).toResponse())

    @Operation(summary = "Get veterinarian profile by user id")
    @GetMapping("/by-user/{userId}")
    fun findByUserId(@PathVariable userId: UUID): ApiResponse<VeterinarianResponse> =
        ApiResponse.success(getVeterinarianUseCase.findByUserId(userId).toResponse())

    @Operation(
        summary = "Create veterinarian profile",
        description = "The referenced user must have the VETERINARIAN role and may own only one veterinarian profile.",
    )
    @PostMapping
    fun create(@RequestBody request: CreateVeterinarianRequest): ResponseEntity<ApiResponse<VeterinarianResponse>> =
        ApiResponse.created(createVeterinarianUseCase.create(request.toDto()).toResponse())

    @Operation(summary = "Update veterinarian profile")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @RequestBody request: UpdateVeterinarianRequest,
    ): ApiResponse<VeterinarianResponse> =
        ApiResponse.success(updateVeterinarianUseCase.update(id, request.toDto()).toResponse())

    @Operation(summary = "Delete veterinarian profile")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteVeterinarianUseCase.delete(id)
        return ApiResponse.noContent()
    }
}
