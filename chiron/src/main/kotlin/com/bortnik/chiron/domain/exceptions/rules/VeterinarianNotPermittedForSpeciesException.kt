package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import java.util.UUID

class VeterinarianNotPermittedForSpeciesException(
    val veterinarianId: UUID,
    val speciesId: UUID,
) : BusinessRuleViolationException("Veterinarian $veterinarianId is not permitted to work with species $speciesId")
