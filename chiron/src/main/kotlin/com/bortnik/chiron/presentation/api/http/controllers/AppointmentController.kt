package com.bortnik.chiron.presentation.api.http.controllers

import com.bortnik.chiron.application.usecase.appointment.CheckAppointmentAvailabilityUseCase
import com.bortnik.chiron.application.usecase.appointment.CreateAppointmentUseCase
import com.bortnik.chiron.application.usecase.appointment.DeleteAppointmentUseCase
import com.bortnik.chiron.application.usecase.appointment.GetAppointmentUseCase
import com.bortnik.chiron.application.usecase.appointment.UpdateAppointmentUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.CreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.UpdateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.response.AppointmentResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
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
import java.time.Instant
import java.util.UUID

@RestController
@RequestMapping("/api/v1/appointments")
@Tag(name = "Appointments")
class AppointmentController(
    private val createAppointmentUseCase: CreateAppointmentUseCase,
    private val getAppointmentUseCase: GetAppointmentUseCase,
    private val updateAppointmentUseCase: UpdateAppointmentUseCase,
    private val deleteAppointmentUseCase: DeleteAppointmentUseCase,
    private val checkAppointmentAvailabilityUseCase: CheckAppointmentAvailabilityUseCase,
) {
    @Operation(summary = "Get appointment by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<AppointmentResponse> =
        ApiResponse.success(getAppointmentUseCase.findById(id).toResponse())

    @Operation(summary = "List appointments of a veterinarian")
    @GetMapping("/by-veterinarian/{veterinarianId}")
    fun findAllByVeterinarianId(@PathVariable veterinarianId: UUID): ApiResponse<List<AppointmentResponse>> =
        ApiResponse.success(getAppointmentUseCase.findAllByVeterinarianId(veterinarianId).map { it.toResponse() })

    @Operation(summary = "List appointments of a pet")
    @GetMapping("/by-pet/{petId}")
    fun findAllByPetId(@PathVariable petId: UUID): ApiResponse<List<AppointmentResponse>> =
        ApiResponse.success(getAppointmentUseCase.findAllByPetId(petId).map { it.toResponse() })

    @Operation(
        summary = "Check slot availability",
        description = """
            Returns true when the veterinarian can take the slot.
            Otherwise responds with AppointmentSlotUnavailableException whose message contains the reason.
            A slot must start and end on the same day in the clinic time zone, start on the clinic slot grid,
            fit into the working hours (custom hours of a schedule exception take precedence over the weekly schedule),
            not overlap the break and not overlap another non-cancelled appointment.
        """,
    )
    @GetMapping("/availability")
    fun checkAvailability(
        @RequestParam veterinarianId: UUID,
        @Parameter(description = "Slot start, ISO-8601 instant") @RequestParam startAt: Instant,
        @Parameter(description = "Slot end, ISO-8601 instant") @RequestParam endAt: Instant,
        @Parameter(description = "Appointment ignored in the overlap check, used when rescheduling it")
        @RequestParam(required = false) excludeAppointmentId: UUID?,
    ): ApiResponse<Boolean> {
        checkAppointmentAvailabilityUseCase.check(veterinarianId, startAt, endAt, excludeAppointmentId)
        return ApiResponse.success(true)
    }

    @Operation(
        summary = "Create appointment",
        description = """
            The pet must not be archived, the veterinarian must be active and permitted to treat the pet's species,
            the service must be active and available for the pet's species, and the slot must be available.
        """,
    )
    @PostMapping
    fun create(@RequestBody request: CreateAppointmentRequest): ResponseEntity<ApiResponse<AppointmentResponse>> =
        ApiResponse.created(createAppointmentUseCase.create(request.toDto()).toResponse())

    @Operation(
        summary = "Update appointment",
        description = """
            Allowed status transitions: PENDING -> CONFIRMED | CANCELLED; CONFIRMED -> COMPLETED | CANCELLED | NO_SHOW.
            COMPLETED, CANCELLED and NO_SHOW are terminal.
            Changing the veterinarian or the time re-runs the veterinarian and slot availability checks.
        """,
    )
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @RequestBody request: UpdateAppointmentRequest,
    ): ApiResponse<AppointmentResponse> =
        ApiResponse.success(updateAppointmentUseCase.update(id, request.toDto()).toResponse())

    @Operation(summary = "Delete appointment")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteAppointmentUseCase.delete(id)
        return ApiResponse.noContent()
    }
}
