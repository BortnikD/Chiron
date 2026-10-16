package com.bortnik.chiron.presentation.api.http.dto.request.service

import io.swagger.v3.oas.annotations.Parameter
import java.util.UUID

data class ServiceFilterRequest(
    val specializationId: UUID? = null,
    @field:Parameter(description = "Return only services offered for this species")
    val speciesId: UUID? = null,
    val isActive: Boolean? = null,
)
