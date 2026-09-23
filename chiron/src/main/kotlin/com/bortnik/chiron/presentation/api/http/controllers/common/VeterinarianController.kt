package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.usecase.common.veterinarian.GetVeterinarianUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/veterinarians")
@Tag(name = "Veterinarians")
class VeterinarianController(private val getVeterinarianUseCase: GetVeterinarianUseCase) {

    @Operation(summary = "List all veterinarians")
    @GetMapping
    fun findAll(): ApiResponse<List<VeterinarianResponse>> =
        ApiResponse.success(getVeterinarianUseCase.findAll().map { it.toResponse() })

    @Operation(summary = "Get veterinarian by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<VeterinarianResponse> =
        ApiResponse.success(getVeterinarianUseCase.findById(id).toResponse())
}
