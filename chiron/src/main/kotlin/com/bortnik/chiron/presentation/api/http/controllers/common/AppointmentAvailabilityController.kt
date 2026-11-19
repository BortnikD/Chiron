package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.usecase.common.appointment.CheckAppointmentAvailabilityUseCase
import com.bortnik.chiron.application.usecase.common.appointment.FindAvailableSlotsUseCase
import com.bortnik.chiron.domain.dto.appointment.AvailableSlotFilter
import com.bortnik.chiron.domain.utils.ValidationConstants.AppointmentRules
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.AvailableSlotResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/v1/appointments")
@Tag(name = "Appointments")
class AppointmentAvailabilityController(
    private val checkAppointmentAvailabilityUseCase: CheckAppointmentAvailabilityUseCase,
    private val findAvailableSlotsUseCase: FindAvailableSlotsUseCase,
) {
    @Operation(
        summary = "Check slot availability",
        description = """
            Returns true when the veterinarian can take the slot.
            Otherwise responds with AppointmentSlotUnavailableException whose message contains the reason.
            endAt must be after startAt; invalid bounds return 400.
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
        summary = "Find available slots",
        description = """
            Returns free slots in the period, sorted by start time, each with the veterinarians who can take it.
            Without veterinarianId all active veterinarians permitted to treat the species and matching every selected
            service specialization are searched; with it the veterinarian must meet the same requirements.
            A slot lasts for the sum of species-specific service durations plus the maximum service buffer, starts on the clinic
            slot grid and satisfies the same rules as the slot availability check; slots in the past are omitted.
            Every service must be active and available for the species. Select 1 to 20 distinct services.
            The period is given in clinic-local dates, both inclusive, and must not exceed 14 days.
        """,
    )
    @GetMapping("/slots")
    fun findAvailableSlots(
        @RequestParam speciesId: UUID,
        @Size(min = 1, max = AppointmentRules.MAX_SERVICES)
        @RequestParam serviceIds: List<@NotNull UUID>,
        @RequestParam(required = false) veterinarianId: UUID?,
        @Parameter(description = "First date of the period, ISO-8601 date") @RequestParam from: LocalDate,
        @Parameter(description = "Last date of the period, ISO-8601 date") @RequestParam to: LocalDate,
    ): ApiResponse<List<AvailableSlotResponse>> =
        ApiResponse.success(
            findAvailableSlotsUseCase.find(
                AvailableSlotFilter(
                    speciesId = speciesId,
                    serviceIds = serviceIds,
                    veterinarianId = veterinarianId,
                    from = from,
                    to = to,
                ),
            ).map { it.toResponse() },
        )
}
