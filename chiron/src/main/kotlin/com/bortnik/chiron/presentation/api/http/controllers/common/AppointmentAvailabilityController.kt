package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.usecase.common.appointment.CheckAppointmentAvailabilityUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

@RestController
@RequestMapping("/api/v1/appointments")
@Tag(name = "Appointments")
class AppointmentAvailabilityController(
    private val checkAppointmentAvailabilityUseCase: CheckAppointmentAvailabilityUseCase,
) {
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
}
