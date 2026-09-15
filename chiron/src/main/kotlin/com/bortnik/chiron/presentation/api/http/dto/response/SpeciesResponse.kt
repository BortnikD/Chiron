package com.bortnik.chiron.presentation.api.http.dto.response

import java.util.UUID

data class SpeciesResponse(
    val id: UUID,
    val name: String,
)
