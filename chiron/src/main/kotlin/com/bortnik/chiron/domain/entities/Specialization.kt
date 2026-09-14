package com.bortnik.chiron.domain.entities

import java.util.UUID

data class Specialization(
    val id: UUID,
    val name: String,
    val description: String,
)
