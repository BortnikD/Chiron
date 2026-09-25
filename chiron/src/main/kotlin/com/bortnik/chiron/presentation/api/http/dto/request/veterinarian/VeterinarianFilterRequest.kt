package com.bortnik.chiron.presentation.api.http.dto.request.veterinarian

import io.swagger.v3.oas.annotations.Parameter
import java.util.UUID

data class VeterinarianFilterRequest(
    val specializationId: UUID? = null,
    @field:Parameter(description = "Return only veterinarians permitted to treat this species")
    val speciesId: UUID? = null,
    val isActive: Boolean? = null,
)
