package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import java.util.UUID

class AppointmentPetMismatchException(
    val appointmentId: UUID,
    val petId: UUID,
) : BusinessRuleViolationException("Appointment $appointmentId does not belong to pet $petId")
