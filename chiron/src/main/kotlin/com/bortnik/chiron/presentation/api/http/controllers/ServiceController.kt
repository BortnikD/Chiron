package com.bortnik.chiron.presentation.api.http.controllers

import com.bortnik.chiron.application.usecase.service.CreateServiceUseCase
import com.bortnik.chiron.application.usecase.service.DeleteServiceUseCase
import com.bortnik.chiron.application.usecase.service.GetServiceUseCase
import com.bortnik.chiron.application.usecase.service.UpdateServiceUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.service.CreateServiceRequest
import com.bortnik.chiron.presentation.api.http.dto.request.service.UpdateServiceRequest
import com.bortnik.chiron.presentation.api.http.dto.response.ServiceResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/services")
@Tag(name = "Services")
class ServiceController(
    private val createServiceUseCase: CreateServiceUseCase,
    private val getServiceUseCase: GetServiceUseCase,
    private val updateServiceUseCase: UpdateServiceUseCase,
    private val deleteServiceUseCase: DeleteServiceUseCase,
) {
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

    @Operation(summary = "Create service")
    @PostMapping
    fun create(@RequestBody request: CreateServiceRequest): ResponseEntity<ApiResponse<ServiceResponse>> =
        ApiResponse.created(createServiceUseCase.create(request.toDto()).toResponse())

    @Operation(summary = "Update service")
    @PutMapping("/{id}")
    fun update(@PathVariable id: UUID, @RequestBody request: UpdateServiceRequest): ApiResponse<ServiceResponse> =
        ApiResponse.success(updateServiceUseCase.update(id, request.toDto()).toResponse())

    @Operation(summary = "Delete service")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteServiceUseCase.delete(id)
        return ApiResponse.noContent()
    }
}
