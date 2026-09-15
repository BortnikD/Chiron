package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.usecase.species.CreateSpeciesUseCase
import com.bortnik.chiron.application.usecase.species.DeleteSpeciesUseCase
import com.bortnik.chiron.application.usecase.species.UpdateSpeciesUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.species.CreateSpeciesRequest
import com.bortnik.chiron.presentation.api.http.dto.request.species.UpdateSpeciesRequest
import com.bortnik.chiron.presentation.api.http.dto.response.SpeciesResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/admin/species")
@Tag(name = "Admin: Species")
class AdminSpeciesController(
    private val createSpeciesUseCase: CreateSpeciesUseCase,
    private val updateSpeciesUseCase: UpdateSpeciesUseCase,
    private val deleteSpeciesUseCase: DeleteSpeciesUseCase,
) {
    @Operation(summary = "Create species")
    @PostMapping
    fun create(@RequestBody request: CreateSpeciesRequest): ResponseEntity<ApiResponse<SpeciesResponse>> =
        ApiResponse.created(createSpeciesUseCase.create(request.toDto()).toResponse())

    @Operation(summary = "Update species")
    @PutMapping("/{id}")
    fun update(@PathVariable id: UUID, @RequestBody request: UpdateSpeciesRequest): ApiResponse<SpeciesResponse> =
        ApiResponse.success(updateSpeciesUseCase.update(id, request.toDto()).toResponse())

    @Operation(summary = "Delete species")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteSpeciesUseCase.delete(id)
        return ApiResponse.noContent()
    }
}
