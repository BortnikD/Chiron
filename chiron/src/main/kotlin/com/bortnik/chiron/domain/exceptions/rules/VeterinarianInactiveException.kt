package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import java.util.UUID

class VeterinarianInactiveException(
    val veterinarianId: UUID,
) : BusinessRuleViolationException("Veterinarian $veterinarianId is inactive")
