package com.bortnik.chiron.presentation.api.http.dto.request.pet

import com.bortnik.chiron.domain.entities.enums.Gender
import com.bortnik.chiron.domain.utils.ValidationConstants.SEARCH_MAX_LENGTH
import io.swagger.v3.oas.annotations.Parameter
import jakarta.validation.constraints.Size
import java.util.UUID

data class PetFilterRequest(
    val ownerId: UUID? = null,
    val speciesId: UUID? = null,
    val gender: Gender? = null,
    val isArchived: Boolean? = null,
    @field:Parameter(description = "Case-insensitive substring of the pet's name")
    @field:Size(max = SEARCH_MAX_LENGTH, message = "must be at most $SEARCH_MAX_LENGTH characters")
    val name: String? = null,
)
