package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import java.util.UUID

class PetArchivedException(
    val petId: UUID,
) : BusinessRuleViolationException("Pet $petId is archived")
