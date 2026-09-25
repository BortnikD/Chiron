package com.bortnik.chiron.domain.dto.pet

import com.bortnik.chiron.domain.entities.enums.Gender
import java.util.UUID

// Null fields are not filtered on; name matches a substring of the pet's name.
data class PetFilter(
    val ownerId: UUID? = null,
    val speciesId: UUID? = null,
    val gender: Gender? = null,
    val isArchived: Boolean? = null,
    val name: String? = null,
)
