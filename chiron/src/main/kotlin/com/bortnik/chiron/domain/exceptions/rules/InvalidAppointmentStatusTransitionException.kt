package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import java.util.UUID

class InvalidAppointmentStatusTransitionException(
    val appointmentId: UUID,
    val from: AppointmentStatus,
    val to: AppointmentStatus,
) : BusinessRuleViolationException("Invalid status transition for appointment $appointmentId: $from -> $to")
