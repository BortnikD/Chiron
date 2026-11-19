package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import com.bortnik.chiron.domain.exceptions.ValidationError

class InvalidCurrentPasswordException :
    BusinessRuleViolationException(listOf(ValidationError("currentPassword", "is incorrect")))
