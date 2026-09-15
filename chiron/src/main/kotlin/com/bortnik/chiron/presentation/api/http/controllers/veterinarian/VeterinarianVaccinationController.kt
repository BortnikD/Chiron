package com.bortnik.chiron.presentation.api.http.controllers.veterinarian

import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.vaccination.CreateVaccinationUseCase
import com.bortnik.chiron.application.usecase.vaccination.GetVaccinationUseCase
import com.bortnik.chiron.application.usecase.vaccination.UpdateVaccinationUseCase
import com.bortnik.chiron.application.usecase.veterinarian.GetVeterinarianUseCase
import com.bortnik.chiron.infrastructure.security.AuthenticatedUser
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
    private val getVeterinarianUseCase: GetVeterinarianUseCase,
    private val createVaccinationUseCase: CreateVaccinationUseCase,
    private val getVaccinationUseCase: GetVaccinationUseCase,
    private val updateVaccinationUseCase: UpdateVaccinationUseCase,
    private val accessGuard: ResourceAccessGuard,
) {
    @Operation(summary = "List vaccinations of a patient")
    @GetMapping
    fun findAllByPetId(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @RequestParam petId: UUID,
    ): ApiResponse<List<VaccinationResponse>> {
        accessGuard.requirePatient(veterinarianId(user), petId)
        return ApiResponse.success(getVaccinationUseCase.findAllByPetId(petId).map { it.toResponse() })
    }

    @Operation(
        summary = "Create vaccination for a patient",
        description = "appointmentId is optional; when set, the appointment must belong to the same pet.",
    )
    @PostMapping
    fun create(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @RequestBody request: CreateVaccinationRequest,
    ): ResponseEntity<ApiResponse<VaccinationResponse>> {
        accessGuard.requirePatient(veterinarianId(user), request.petId)
        return ApiResponse.created(createVaccinationUseCase.create(request.toDto()).toResponse())
    }

    @Operation(summary = "Update vaccination of a patient")
    @PutMapping("/{id}")
    fun update(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID,
        @RequestBody request: UpdateVaccinationRequest,
    ): ApiResponse<VaccinationResponse> {
        accessGuard.requirePatientVaccination(veterinarianId(user), id)
        return ApiResponse.success(updateVaccinationUseCase.update(id, request.toDto()).toResponse())
    }

    private fun veterinarianId(user: AuthenticatedUser): UUID = getVeterinarianUseCase.findByUserId(user.id).id
}
