package com.bortnik.chiron.presentation.api.http.controllers.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.veterinarian.vaccination.VeterinarianCreateVaccinationUseCase
import com.bortnik.chiron.application.usecase.veterinarian.vaccination.VeterinarianGetVaccinationUseCase
import com.bortnik.chiron.application.usecase.veterinarian.vaccination.VeterinarianUpdateVaccinationUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.pagination.PaginationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.CreateVaccinationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.UpdateVaccinationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.VeterinarianVaccinationFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.response.PageResponse
import com.bortnik.chiron.presentation.api.http.dto.response.VaccinationResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/veterinarian/vaccinations")
@Tag(
    name = "Veterinarian: Vaccinations",
    description = "Vaccinations of the current veterinarian's patients: pets with at least one appointment with them.",
)
class VeterinarianVaccinationController(
    private val createVaccinationUseCase: VeterinarianCreateVaccinationUseCase,
    private val getVaccinationUseCase: VeterinarianGetVaccinationUseCase,
    private val updateVaccinationUseCase: VeterinarianUpdateVaccinationUseCase,
) {
    @Operation(
        summary = "List vaccinations of patients",
        description = """
            All filters are optional and combined with AND; a nextDue bound excludes vaccinations without a next due
            date. Sorted by administration date descending.
        """,
    )
    @GetMapping
    fun findAll(
        @AuthenticationPrincipal actor: Actor,
        @Valid @ParameterObject filter: VeterinarianVaccinationFilterRequest,
        @Valid @ParameterObject pagination: PaginationRequest,
    ): ApiResponse<PageResponse<VaccinationResponse>> =
        ApiResponse.success(
            getVaccinationUseCase.findAll(actor, filter.toDto(), pagination.toDto()).toResponse { it.toResponse() },
        )

    @Operation(
        summary = "Create vaccination for a patient",
        description = "appointmentId is optional; when set, the appointment must belong to the same pet.",
    )
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @Valid @RequestBody request: CreateVaccinationRequest,
    ): ResponseEntity<ApiResponse<VaccinationResponse>> =
        ApiResponse.created(createVaccinationUseCase.create(actor, request.toDto()).toResponse())

    @Operation(summary = "Update vaccination of a patient")
    @PatchMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateVaccinationRequest,
    ): ApiResponse<VaccinationResponse> =
        ApiResponse.success(updateVaccinationUseCase.update(actor, id, request.toDto()).toResponse())
}
