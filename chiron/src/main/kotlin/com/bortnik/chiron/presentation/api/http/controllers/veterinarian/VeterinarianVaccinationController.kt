package com.bortnik.chiron.presentation.api.http.controllers.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.veterinarian.vaccination.VeterinarianCreateVaccinationUseCase
import com.bortnik.chiron.application.usecase.veterinarian.vaccination.VeterinarianGetVaccinationUseCase
import com.bortnik.chiron.application.usecase.veterinarian.vaccination.VeterinarianUpdateVaccinationUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.CreateVaccinationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.UpdateVaccinationRequest
import com.bortnik.chiron.presentation.api.http.dto.response.VaccinationResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
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
    @Operation(summary = "List vaccinations of a patient")
    @GetMapping
    fun findAllByPetId(
        @AuthenticationPrincipal actor: Actor,
        @RequestParam petId: UUID,
    ): ApiResponse<List<VaccinationResponse>> =
        ApiResponse.success(getVaccinationUseCase.findAllByPetId(actor, petId).map { it.toResponse() })

    @Operation(
        summary = "Create vaccination for a patient",
        description = "appointmentId is optional; when set, the appointment must belong to the same pet.",
    )
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @RequestBody request: CreateVaccinationRequest,
    ): ResponseEntity<ApiResponse<VaccinationResponse>> =
        ApiResponse.created(createVaccinationUseCase.create(actor, request.toDto()).toResponse())

    @Operation(summary = "Update vaccination of a patient")
    @PutMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @RequestBody request: UpdateVaccinationRequest,
    ): ApiResponse<VaccinationResponse> =
        ApiResponse.success(updateVaccinationUseCase.update(actor, id, request.toDto()).toResponse())
}
