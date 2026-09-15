package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.usecase.vaccination.CreateVaccinationUseCase
import com.bortnik.chiron.application.usecase.vaccination.DeleteVaccinationUseCase
import com.bortnik.chiron.application.usecase.vaccination.GetVaccinationUseCase
import com.bortnik.chiron.application.usecase.vaccination.UpdateVaccinationUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.CreateVaccinationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.UpdateVaccinationRequest
import com.bortnik.chiron.presentation.api.http.dto.response.VaccinationResponse
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
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/admin/vaccinations")
@Tag(name = "Admin: Vaccinations")
class AdminVaccinationController(
    private val createVaccinationUseCase: CreateVaccinationUseCase,
    private val getVaccinationUseCase: GetVaccinationUseCase,
    private val updateVaccinationUseCase: UpdateVaccinationUseCase,
    private val deleteVaccinationUseCase: DeleteVaccinationUseCase,
) {
    @Operation(summary = "List vaccinations of a pet")
    @GetMapping
    fun findAllByPetId(@RequestParam petId: UUID): ApiResponse<List<VaccinationResponse>> =
        ApiResponse.success(getVaccinationUseCase.findAllByPetId(petId).map { it.toResponse() })

    @Operation(summary = "Get vaccination by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<VaccinationResponse> =
        ApiResponse.success(getVaccinationUseCase.findById(id).toResponse())

    @Operation(
        summary = "Create vaccination",
        description = "appointmentId is optional; when set, the appointment must belong to the same pet.",
    )
    @PostMapping
    fun create(@RequestBody request: CreateVaccinationRequest): ResponseEntity<ApiResponse<VaccinationResponse>> =
        ApiResponse.created(createVaccinationUseCase.create(request.toDto()).toResponse())

    @Operation(summary = "Update vaccination")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @RequestBody request: UpdateVaccinationRequest,
    ): ApiResponse<VaccinationResponse> =
        ApiResponse.success(updateVaccinationUseCase.update(id, request.toDto()).toResponse())

    @Operation(summary = "Delete vaccination")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteVaccinationUseCase.delete(id)
        return ApiResponse.noContent()
    }
}
