package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.usecase.common.veterinarianspeciespermission.GetVeterinarianSpeciesPermissionUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianSpeciesPermissionResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/veterinarians/{veterinarianId}/species")
@Tag(name = "Veterinarian species permissions")
class VeterinarianSpeciesPermissionController(
    private val getPermissionUseCase: GetVeterinarianSpeciesPermissionUseCase,
) {
    @Operation(summary = "List species the veterinarian may treat")
    @GetMapping
    fun findAllByVeterinarianId(
        @PathVariable veterinarianId: UUID,
    ): ApiResponse<List<VeterinarianSpeciesPermissionResponse>> =
        ApiResponse.success(getPermissionUseCase.findAllByVeterinarianId(veterinarianId).map { it.toResponse() })

    @Operation(summary = "Check whether the veterinarian may treat the species")
    @GetMapping("/{speciesId}/exists")
    fun exists(@PathVariable veterinarianId: UUID, @PathVariable speciesId: UUID): ApiResponse<Boolean> =
        ApiResponse.success(getPermissionUseCase.exists(veterinarianId, speciesId))
}
