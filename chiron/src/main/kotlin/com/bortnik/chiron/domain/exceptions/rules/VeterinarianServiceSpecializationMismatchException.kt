package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import java.util.UUID

class VeterinarianServiceSpecializationMismatchException(
    val veterinarianId: UUID,
    val specializationId: UUID,
) : BusinessRuleViolationException(
    "Veterinarian $veterinarianId does not have the required specialization $specializationId",
)
