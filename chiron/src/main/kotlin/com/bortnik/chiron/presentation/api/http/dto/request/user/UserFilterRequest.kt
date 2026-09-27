package com.bortnik.chiron.presentation.api.http.dto.request.user

import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.utils.ValidationConstants.SEARCH_MAX_LENGTH
import io.swagger.v3.oas.annotations.Parameter
import jakarta.validation.constraints.Size
import java.time.Instant

data class UserFilterRequest(
    val role: UserRole? = null,
    @field:Parameter(description = "Case-insensitive substring of the full name, first name, middle name, email or phone")
    @field:Size(max = SEARCH_MAX_LENGTH, message = "must be at most $SEARCH_MAX_LENGTH characters")
    val search: String? = null,
    @field:Parameter(description = "Users registered at or after this ISO-8601 instant")
    val createdFrom: Instant? = null,
    @field:Parameter(description = "Users registered before this ISO-8601 instant")
    val createdTo: Instant? = null,
)
