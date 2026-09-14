package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import java.time.Instant
import java.util.UUID

class AppointmentSlotUnavailableException(
    val veterinarianId: UUID,
    val startAt: Instant,
    val endAt: Instant,
    val reason: String,
) : BusinessRuleViolationException("Slot $startAt - $endAt is unavailable for veterinarian $veterinarianId: $reason")
