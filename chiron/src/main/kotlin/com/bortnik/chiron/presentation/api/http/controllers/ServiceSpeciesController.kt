package com.bortnik.chiron.presentation.api.http.controllers

import com.bortnik.chiron.application.usecase.servicespecies.CreateServiceSpeciesUseCase
import com.bortnik.chiron.application.usecase.servicespecies.DeleteServiceSpeciesUseCase
import com.bortnik.chiron.application.usecase.servicespecies.GetServiceSpeciesUseCase
import com.bortnik.chiron.application.usecase.servicespecies.UpdateServiceSpeciesUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.servicespecies.CreateServiceSpeciesRequest
import com.bortnik.chiron.presentation.api.http.dto.request.servicespecies.UpdateServiceSpeciesRequest
import com.bortnik.chiron.presentation.api.http.dto.response.ServiceSpeciesResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDomain
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/services/{serviceId}/species")
@Tag(
    name = "Service species",
    description = """
        Links a service to the species it can be provided for.
        An appointment can be created only if the pet's species is linked to the booked service,
        otherwise the request is rejected with ServiceNotAvailableForSpeciesException.
        The link optionally carries species-specific overrides of the service's baseDurationMin and basePrice
        (e.g. a dental cleaning takes longer and costs more for a dog than for a cat).
        A null durationMin or price means the service's base value applies.
    """,
)
class ServiceSpeciesController(
    private val createServiceSpeciesUseCase: CreateServiceSpeciesUseCase,
    private val getServiceSpeciesUseCase: GetServiceSpeciesUseCase,
    private val updateServiceSpeciesUseCase: UpdateServiceSpeciesUseCase,
    private val deleteServiceSpeciesUseCase: DeleteServiceSpeciesUseCase,
) {
    @Operation(summary = "List species the service is available for")
    @GetMapping
    fun findAllByServiceId(@PathVariable serviceId: UUID): ApiResponse<List<ServiceSpeciesResponse>> =
        ApiResponse.success(getServiceSpeciesUseCase.findAllByServiceId(serviceId).map { it.toResponse() })

    @Operation(summary = "Get service-species link")
    @GetMapping("/{speciesId}")
    fun findById(@PathVariable serviceId: UUID, @PathVariable speciesId: UUID): ApiResponse<ServiceSpeciesResponse> =
        ApiResponse.success(getServiceSpeciesUseCase.findById(serviceId, speciesId).toResponse())

    @Operation(
        summary = "Make service available for species",
        description = "Optional durationMin and price override the service's base values for this species.",
    )
    @PostMapping
    fun create(
        @PathVariable serviceId: UUID,
        @RequestBody request: CreateServiceSpeciesRequest,
    ): ResponseEntity<ApiResponse<ServiceSpeciesResponse>> =
        ApiResponse.created(createServiceSpeciesUseCase.create(request.toDomain(serviceId)).toResponse())

    @Operation(
        summary = "Update species-specific overrides",
        description = "Replaces durationMin and price overrides; pass null to fall back to the service's base values.",
    )
    @PutMapping("/{speciesId}")
    fun update(
        @PathVariable serviceId: UUID,
        @PathVariable speciesId: UUID,
        @RequestBody request: UpdateServiceSpeciesRequest,
    ): ApiResponse<ServiceSpeciesResponse> =
        ApiResponse.success(updateServiceSpeciesUseCase.update(serviceId, speciesId, request.toDto()).toResponse())

    @Operation(summary = "Make service unavailable for species")
    @DeleteMapping("/{speciesId}")
    fun delete(@PathVariable serviceId: UUID, @PathVariable speciesId: UUID): ResponseEntity<Nothing> {
        deleteServiceSpeciesUseCase.delete(serviceId, speciesId)
        return ApiResponse.noContent()
    }
}
