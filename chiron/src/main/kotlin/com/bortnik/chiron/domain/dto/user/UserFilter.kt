package com.bortnik.chiron.domain.dto.user

import com.bortnik.chiron.domain.entities.enums.UserRole
import java.time.Instant

// Null fields are not filtered on; search matches full name, first name, middle name, email or phone;
// createdFrom / createdTo bound createdAt as [createdFrom, createdTo).
data class UserFilter(
    val role: UserRole? = null,
    val search: String? = null,
    val createdFrom: Instant? = null,
    val createdTo: Instant? = null,
)
