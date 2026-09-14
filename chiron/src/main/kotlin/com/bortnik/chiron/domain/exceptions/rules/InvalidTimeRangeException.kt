package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException

class InvalidTimeRangeException(
    val start: Any,
    val end: Any,
) : BusinessRuleViolationException("Invalid time range: start $start must be before end $end")
