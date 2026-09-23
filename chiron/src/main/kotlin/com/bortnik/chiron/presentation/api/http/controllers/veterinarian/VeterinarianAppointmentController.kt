package com.bortnik.chiron.presentation.api.http.controllers.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.veterinarian.appointment.VeterinarianGetAppointmentUseCase
import com.bortnik.chiron.application.usecase.veterinarian.appointment.VeterinarianUpdateAppointmentStatusUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.VeterinarianUpdateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.response.AppointmentResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/veterinarian/appointments")
@Tag(name = "Veterinarian: Appointments")
class VeterinarianAppointmentController(
    private val getAppointmentUseCase: VeterinarianGetAppointmentUseCase,
    private val updateAppointmentStatusUseCase: VeterinarianUpdateAppointmentStatusUseCase,
) {
    @Operation(summary = "List own appointments")
    @GetMapping
    fun findAll(@AuthenticationPrincipal actor: Actor): ApiResponse<List<AppointmentResponse>> =
        ApiResponse.success(getAppointmentUseCase.findAll(actor).map { it.toResponse() })

    @Operation(summary = "Get own appointment by id")
    @GetMapping("/{id}")
    fun findById(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
    ): ApiResponse<AppointmentResponse> =
        ApiResponse.success(getAppointmentUseCase.findById(actor, id).toResponse())

    @Operation(
        summary = "Update status and notes of own appointment",
        description = """
            Allowed status transitions: PENDING -> CONFIRMED | CANCELLED; CONFIRMED -> COMPLETED | CANCELLED | NO_SHOW.
            Omitted fields are kept; vetNotes: null clears the notes.
            cancelReason is used only when the appointment is being cancelled;
            the current user and time are recorded as the cancellation author and moment.
            Time, veterinarian and client comment cannot be changed here.
        """,
    )
    @PatchMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @Valid @RequestBody request: VeterinarianUpdateAppointmentRequest,
    ): ApiResponse<AppointmentResponse> =
        ApiResponse.success(updateAppointmentStatusUseCase.update(actor, id, request.toDto()).toResponse())
}
