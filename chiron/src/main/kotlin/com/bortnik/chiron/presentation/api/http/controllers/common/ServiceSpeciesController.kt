package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.usecase.common.servicespecies.GetServiceSpeciesUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.ServiceSpeciesResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/services/{serviceId}/species")
@Tag(name = "Service species")
class ServiceSpeciesController(private val getServiceSpeciesUseCase: GetServiceSpeciesUseCase) {

    @Operation(summary = "List species the service is available for")
    @GetMapping
    fun findAllByServiceId(@PathVariable serviceId: UUID): ApiResponse<List<ServiceSpeciesResponse>> =
        ApiResponse.success(getServiceSpeciesUseCase.findAllByServiceId(serviceId).map { it.toResponse() })

    @Operation(summary = "Get service-species link")
    @GetMapping("/{speciesId}")
    fun findById(@PathVariable serviceId: UUID, @PathVariable speciesId: UUID): ApiResponse<ServiceSpeciesResponse> =
        ApiResponse.success(getServiceSpeciesUseCase.findById(serviceId, speciesId).toResponse())
}
