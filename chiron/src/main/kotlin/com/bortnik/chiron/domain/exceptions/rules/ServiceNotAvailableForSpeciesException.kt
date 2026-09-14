package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import java.util.UUID

class ServiceNotAvailableForSpeciesException(
    val serviceId: UUID,
    val speciesId: UUID,
) : BusinessRuleViolationException("Service $serviceId is not available for species $speciesId")
