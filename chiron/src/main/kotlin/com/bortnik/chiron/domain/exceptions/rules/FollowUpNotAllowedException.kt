package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import java.util.UUID

class FollowUpNotAllowedException(
    val appointmentId: UUID,
    val reason: String,
) : BusinessRuleViolationException("Follow-up cannot be scheduled for appointment $appointmentId: $reason")
