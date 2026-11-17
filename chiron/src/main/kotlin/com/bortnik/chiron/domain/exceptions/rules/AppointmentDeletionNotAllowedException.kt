package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import java.util.UUID

class AppointmentDeletionNotAllowedException(
    val appointmentId: UUID,
    val status: AppointmentStatus,
) : BusinessRuleViolationException("Only cancelled appointments can be deleted; appointment $appointmentId is $status")
