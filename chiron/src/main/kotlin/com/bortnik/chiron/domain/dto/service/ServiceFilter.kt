package com.bortnik.chiron.domain.dto.service

import java.util.UUID

// Null fields are not filtered on; speciesId keeps services offered for that species.
data class ServiceFilter(
    val specializationId: UUID? = null,
    val speciesId: UUID? = null,
    val isActive: Boolean? = null,
)
