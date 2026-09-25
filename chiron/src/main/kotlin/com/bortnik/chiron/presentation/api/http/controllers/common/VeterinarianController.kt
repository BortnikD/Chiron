package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.usecase.common.veterinarian.GetVeterinarianUseCase
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/veterinarians")
@Tag(name = "Veterinarians")
class VeterinarianController(private val getVeterinarianUseCase: GetVeterinarianUseCase) {

    @Operation(summary = "List active veterinarians")
    @GetMapping
    fun findAll(
        @Parameter(description = "Return only veterinarians of this specialization")
        @RequestParam(required = false) specializationId: UUID?,
        @Parameter(description = "Return only veterinarians permitted to treat this species")
        @RequestParam(required = false) speciesId: UUID?,
    ): ApiResponse<List<VeterinarianResponse>> {
        val filter = VeterinarianFilter(specializationId = specializationId, speciesId = speciesId)
        return ApiResponse.success(getVeterinarianUseCase.findAllActive(filter).map { it.toResponse() })
    }

    @Operation(summary = "Get veterinarian by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<VeterinarianResponse> =
        ApiResponse.success(getVeterinarianUseCase.findById(id).toResponse())
}
