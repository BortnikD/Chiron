package com.bortnik.chiron.domain.dto.veterinarian

import java.util.UUID

// Null fields are not filtered on; speciesId keeps veterinarians permitted to treat that species.
data class VeterinarianFilter(
    val specializationId: UUID? = null,
    val speciesId: UUID? = null,
    val isActive: Boolean? = null,
)
