package com.bortnik.chiron.presentation.api.http.controllers.veterinarian

import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.appointment.GetAppointmentUseCase
import com.bortnik.chiron.application.usecase.appointment.UpdateAppointmentUseCase
import com.bortnik.chiron.application.usecase.veterinarian.GetVeterinarianUseCase
import com.bortnik.chiron.infrastructure.security.AuthenticatedUser
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.VeterinarianUpdateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.response.AppointmentResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import com.bortnik.chiron.presentation.api.http.mappers.toStatusUpdateDto
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/veterinarian/appointments")
@Tag(name = "Veterinarian: Appointments")
class VeterinarianAppointmentController(
    private val getVeterinarianUseCase: GetVeterinarianUseCase,
    private val getAppointmentUseCase: GetAppointmentUseCase,
    private val updateAppointmentUseCase: UpdateAppointmentUseCase,
    private val accessGuard: ResourceAccessGuard,
) {
    @Operation(summary = "List own appointments")
    @GetMapping
    fun findAll(@AuthenticationPrincipal user: AuthenticatedUser): ApiResponse<List<AppointmentResponse>> =
        ApiResponse.success(getAppointmentUseCase.findAllByVeterinarianId(veterinarianId(user)).map { it.toResponse() })

    @Operation(summary = "Get own appointment by id")
    @GetMapping("/{id}")
    fun findById(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID,
    ): ApiResponse<AppointmentResponse> =
        ApiResponse.success(accessGuard.requireAssignedAppointment(veterinarianId(user), id).toResponse())

    @Operation(
        summary = "Update status and notes of own appointment",
        description = """
            Allowed status transitions: PENDING -> CONFIRMED | CANCELLED; CONFIRMED -> COMPLETED | CANCELLED | NO_SHOW.
            vetNotes replaces the current notes. cancelReason is used only when the appointment is being cancelled;
            the current user and time are recorded as the cancellation author and moment.
            Time, veterinarian and client comment cannot be changed here.
        """,
    )
    @PutMapping("/{id}")
    fun update(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID,
        @RequestBody request: VeterinarianUpdateAppointmentRequest,
    ): ApiResponse<AppointmentResponse> {
        val appointment = accessGuard.requireAssignedAppointment(veterinarianId(user), id)
        val dto = appointment.toStatusUpdateDto(request.status, user.id, request.cancelReason)
            .copy(vetNotes = request.vetNotes)
        return ApiResponse.success(updateAppointmentUseCase.update(id, dto).toResponse())
    }

    private fun veterinarianId(user: AuthenticatedUser): UUID = getVeterinarianUseCase.findByUserId(user.id).id
}
