package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.service.AdminCreateServiceUseCase
import com.bortnik.chiron.application.usecase.admin.service.AdminDeleteServiceUseCase
import com.bortnik.chiron.application.usecase.admin.service.AdminGetServiceUseCase
import com.bortnik.chiron.application.usecase.admin.service.AdminUpdateServiceUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.service.CreateServiceRequest
import com.bortnik.chiron.presentation.api.http.dto.request.service.ServiceFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.request.service.UpdateServiceRequest
import com.bortnik.chiron.presentation.api.http.dto.response.ServiceResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/admin/services")
@Tag(name = "Admin: Services")
class AdminServiceController(
    private val createServiceUseCase: AdminCreateServiceUseCase,
    private val getServiceUseCase: AdminGetServiceUseCase,
    private val updateServiceUseCase: AdminUpdateServiceUseCase,
    private val deleteServiceUseCase: AdminDeleteServiceUseCase,
) {
    @Operation(
        summary = "List services, including inactive ones",
        description = "All filters are optional and combined with AND. Sorted by name ascending.",
    )
    @GetMapping
    fun findAll(
        @AuthenticationPrincipal actor: Actor,
        @ParameterObject filter: ServiceFilterRequest,
    ): ApiResponse<List<ServiceResponse>> =
        ApiResponse.success(getServiceUseCase.findAll(actor, filter.toDto()).map { it.toResponse() })

    @Operation(summary = "Create service")
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @Valid @RequestBody request: CreateServiceRequest,
    ): ResponseEntity<ApiResponse<ServiceResponse>> =
        ApiResponse.created(createServiceUseCase.create(actor, request.toDto()).toResponse())

    @Operation(summary = "Update service")
    @PatchMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateServiceRequest,
    ): ApiResponse<ServiceResponse> =
        ApiResponse.success(updateServiceUseCase.update(actor, id, request.toDto()).toResponse())

    @Operation(summary = "Delete service")
    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteServiceUseCase.delete(actor, id)
        return ApiResponse.noContent()
    }
}
