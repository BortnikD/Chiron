package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import java.util.UUID

class UserRoleMismatchException(
    val userId: UUID,
    val expected: UserRole,
    val actual: UserRole,
) : BusinessRuleViolationException("User $userId must have role $expected but has $actual")
