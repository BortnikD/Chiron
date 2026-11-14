package com.bortnik.chiron.domain.entities

import java.util.UUID

data class Species(
    val id: UUID,
    val name: String,
    val color: String? = null,
    val iconKey: String? = null,
)
