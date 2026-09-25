package com.bortnik.chiron.presentation.api.http.dto.request.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import io.swagger.v3.oas.annotations.Parameter
import java.time.Instant
import java.util.UUID

data class VeterinarianAppointmentFilterRequest(
    @field:Parameter(description = "Return only appointments of this pet")
    val petId: UUID? = null,
    @field:Parameter(description = "Return only appointments with one of these statuses")
    val status: Set<AppointmentStatus>? = null,
    @field:Parameter(description = "Appointments starting at or after this ISO-8601 instant")
    val from: Instant? = null,
    @field:Parameter(description = "Appointments starting before this ISO-8601 instant")
    val to: Instant? = null,
)
