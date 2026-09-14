package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import java.util.UUID

class ServiceInactiveException(
    val serviceId: UUID,
) : BusinessRuleViolationException("Service $serviceId is inactive")
