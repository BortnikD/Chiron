package com.bortnik.chiron.presentation.api.http.dto.response

import java.util.UUID

data class SpecializationResponse(
    val id: UUID,
    val name: String,
    val description: String,
)
