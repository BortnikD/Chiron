package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.usecase.common.service.GetServiceUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.ServiceResponse
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
@RequestMapping("/api/v1/services")
@Tag(name = "Services")
class ServiceController(private val getServiceUseCase: GetServiceUseCase) {

    @Operation(summary = "List services")
    @GetMapping
    fun findAll(
        @Parameter(description = "Return only services of this specialization")
        @RequestParam(required = false) specializationId: UUID?,
    ): ApiResponse<List<ServiceResponse>> {
        val services = specializationId
            ?.let { getServiceUseCase.findAllBySpecializationId(it) }
            ?: getServiceUseCase.findAll()
        return ApiResponse.success(services.map { it.toResponse() })
    }

    @Operation(summary = "Get service by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<ServiceResponse> =
        ApiResponse.success(getServiceUseCase.findById(id).toResponse())
}
