package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.usecase.common.species.GetSpeciesUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.SpeciesResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/species")
@Tag(name = "Species")
class SpeciesController(private val getSpeciesUseCase: GetSpeciesUseCase) {

    @Operation(summary = "List all species")
    @GetMapping
    fun findAll(): ApiResponse<List<SpeciesResponse>> =
        ApiResponse.success(getSpeciesUseCase.findAll().map { it.toResponse() })

    @Operation(summary = "Get species by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<SpeciesResponse> =
        ApiResponse.success(getSpeciesUseCase.findById(id).toResponse())

    @Operation(summary = "Get species by name")
    @GetMapping("/by-name")
    fun findByName(@RequestParam name: String): ApiResponse<SpeciesResponse> =
        ApiResponse.success(getSpeciesUseCase.findByName(name).toResponse())
}
