package com.bortnik.chiron.domain.dto.veterinarian

import com.bortnik.chiron.domain.entities.Veterinarian

data class VeterinarianDetailsDto(
    val veterinarian: Veterinarian,
    val firstName: String,
    val middleName: String?,
    val lastName: String,
    val fullName: String,
)
