package com.bortnik.chiron.presentation.api.http.controllers

import com.bortnik.chiron.application.usecase.specialization.CreateSpecializationUseCase
import com.bortnik.chiron.application.usecase.specialization.DeleteSpecializationUseCase
import com.bortnik.chiron.application.usecase.specialization.GetSpecializationUseCase
import com.bortnik.chiron.application.usecase.specialization.UpdateSpecializationUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.specialization.CreateSpecializationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.specialization.UpdateSpecializationRequest
import com.bortnik.chiron.presentation.api.http.dto.response.SpecializationResponse
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
@RequestMapping("/api/v1/specializations")
@Tag(name = "Specializations")
class SpecializationController(
    private val createSpecializationUseCase: CreateSpecializationUseCase,
    private val getSpecializationUseCase: GetSpecializationUseCase,
    private val updateSpecializationUseCase: UpdateSpecializationUseCase,
    private val deleteSpecializationUseCase: DeleteSpecializationUseCase,
) {
    @Operation(summary = "List all specializations")
    @GetMapping
    fun findAll(): ApiResponse<List<SpecializationResponse>> =
        ApiResponse.success(getSpecializationUseCase.findAll().map { it.toResponse() })

    @Operation(summary = "Get specialization by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<SpecializationResponse> =
        ApiResponse.success(getSpecializationUseCase.findById(id).toResponse())

    @Operation(summary = "Create specialization")
    @PostMapping
    fun create(
        @RequestBody request: CreateSpecializationRequest,
    ): ResponseEntity<ApiResponse<SpecializationResponse>> =
        ApiResponse.created(createSpecializationUseCase.create(request.toDto()).toResponse())

    @Operation(summary = "Update specialization")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @RequestBody request: UpdateSpecializationRequest,
    ): ApiResponse<SpecializationResponse> =
        ApiResponse.success(updateSpecializationUseCase.update(id, request.toDto()).toResponse())

    @Operation(summary = "Delete specialization")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteSpecializationUseCase.delete(id)
        return ApiResponse.noContent()
    }
}
