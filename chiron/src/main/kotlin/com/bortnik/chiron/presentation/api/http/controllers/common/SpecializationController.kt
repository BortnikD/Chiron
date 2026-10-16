package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.usecase.common.specialization.GetSpecializationUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.SpecializationResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/specializations")
@Tag(name = "Specializations")
class SpecializationController(private val getSpecializationUseCase: GetSpecializationUseCase) {

    @Operation(summary = "List all specializations")
    @GetMapping
    fun findAll(): ApiResponse<List<SpecializationResponse>> =
        ApiResponse.success(getSpecializationUseCase.findAll().map { it.toResponse() })

    @Operation(summary = "Get specialization by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<SpecializationResponse> =
        ApiResponse.success(getSpecializationUseCase.findById(id).toResponse())
}
