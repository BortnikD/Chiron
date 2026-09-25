package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.appointment.AdminCreateAppointmentUseCase
import com.bortnik.chiron.application.usecase.admin.appointment.AdminDeleteAppointmentUseCase
import com.bortnik.chiron.application.usecase.admin.appointment.AdminGetAppointmentUseCase
import com.bortnik.chiron.application.usecase.admin.appointment.AdminUpdateAppointmentUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.AppointmentFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.CreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.UpdateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pagination.PaginationRequest
import com.bortnik.chiron.presentation.api.http.dto.response.AppointmentResponse
import com.bortnik.chiron.presentation.api.http.dto.response.PageResponse
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
@RequestMapping("/api/v1/admin/appointments")
@Tag(name = "Admin: Appointments")
class AdminAppointmentController(
    private val createAppointmentUseCase: AdminCreateAppointmentUseCase,
    private val getAppointmentUseCase: AdminGetAppointmentUseCase,
    private val updateAppointmentUseCase: AdminUpdateAppointmentUseCase,
    private val deleteAppointmentUseCase: AdminDeleteAppointmentUseCase,
) {
    @Operation(
        summary = "List appointments",
        description = "All filters are optional and combined with AND. Sorted by start time ascending.",
    )
    @GetMapping
    fun findAll(
        @Valid @ParameterObject filter: AppointmentFilterRequest,
        @Valid @ParameterObject pagination: PaginationRequest,
    ): ApiResponse<PageResponse<AppointmentResponse>> =
        ApiResponse.success(
            getAppointmentUseCase.findAll(filter.toDto(), pagination.toDto()).toResponse { it.toResponse() },
        )

    @Operation(summary = "Get appointment by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<AppointmentResponse> =
        ApiResponse.success(getAppointmentUseCase.findById(id).toResponse())

    @Operation(
        summary = "Create appointment",
        description = """
            The pet must not be archived, the veterinarian must be active and permitted to treat the pet's species,
            the service must be active and available for the pet's species, and the slot must be available.
        """,
    )
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @Valid @RequestBody request: CreateAppointmentRequest,
    ): ResponseEntity<ApiResponse<AppointmentResponse>> =
        ApiResponse.created(createAppointmentUseCase.create(actor, request.toDto()).toResponse())

    @Operation(
        summary = "Update appointment",
        description = """
            Allowed status transitions: PENDING -> CONFIRMED | CANCELLED; CONFIRMED -> COMPLETED | CANCELLED | NO_SHOW.
            COMPLETED, CANCELLED and NO_SHOW are terminal.
            Changing the veterinarian or the time re-runs the veterinarian and slot availability checks.
        """,
    )
    @PatchMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateAppointmentRequest,
    ): ApiResponse<AppointmentResponse> =
        ApiResponse.success(updateAppointmentUseCase.update(actor, id, request.toDto()).toResponse())

    @Operation(summary = "Delete appointment")
    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteAppointmentUseCase.delete(actor, id)
        return ApiResponse.noContent()
    }
}
