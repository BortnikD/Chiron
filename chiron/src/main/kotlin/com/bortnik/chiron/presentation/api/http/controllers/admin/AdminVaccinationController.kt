package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.vaccination.AdminCreateVaccinationUseCase
import com.bortnik.chiron.application.usecase.admin.vaccination.AdminDeleteVaccinationUseCase
import com.bortnik.chiron.application.usecase.admin.vaccination.AdminGetVaccinationUseCase
import com.bortnik.chiron.application.usecase.admin.vaccination.AdminUpdateVaccinationUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.CreateVaccinationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.UpdateVaccinationRequest
import com.bortnik.chiron.presentation.api.http.dto.response.VaccinationResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
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
@RequestMapping("/api/v1/admin/vaccinations")
@Tag(name = "Admin: Vaccinations")
class AdminVaccinationController(
    private val createVaccinationUseCase: AdminCreateVaccinationUseCase,
    private val getVaccinationUseCase: AdminGetVaccinationUseCase,
    private val updateVaccinationUseCase: AdminUpdateVaccinationUseCase,
    private val deleteVaccinationUseCase: AdminDeleteVaccinationUseCase,
) {
    @Operation(summary = "List vaccinations of a pet")
    @GetMapping
    fun findAllByPetId(
        @AuthenticationPrincipal actor: Actor,
        @RequestParam petId: UUID,
    ): ApiResponse<List<VaccinationResponse>> =
        ApiResponse.success(getVaccinationUseCase.findAllByPetId(actor, petId).map { it.toResponse() })

    @Operation(summary = "Get vaccination by id")
    @GetMapping("/{id}")
    fun findById(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ApiResponse<VaccinationResponse> =
        ApiResponse.success(getVaccinationUseCase.findById(actor, id).toResponse())

    @Operation(
        summary = "Create vaccination",
        description = "appointmentId is optional; when set, the appointment must belong to the same pet.",
    )
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @Valid @RequestBody request: CreateVaccinationRequest,
    ): ResponseEntity<ApiResponse<VaccinationResponse>> =
        ApiResponse.created(createVaccinationUseCase.create(actor, request.toDto()).toResponse())

    @Operation(summary = "Update vaccination")
    @PutMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateVaccinationRequest,
    ): ApiResponse<VaccinationResponse> =
        ApiResponse.success(updateVaccinationUseCase.update(actor, id, request.toDto()).toResponse())

    @Operation(summary = "Delete vaccination")
    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteVaccinationUseCase.delete(actor, id)
        return ApiResponse.noContent()
    }
}
