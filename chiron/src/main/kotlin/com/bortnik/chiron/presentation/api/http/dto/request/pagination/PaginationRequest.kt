package com.bortnik.chiron.presentation.api.http.dto.request.pagination

import com.bortnik.chiron.domain.utils.ValidationConstants.PaginationRules
import io.swagger.v3.oas.annotations.Parameter
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min

data class PaginationRequest(
    @field:Parameter(description = "Zero-based page number")
    @field:Min(value = 0, message = "must not be negative")
    val page: Int = 0,
    @field:Parameter(description = "Page size")
    @field:Min(
        value = PaginationRules.SIZE_MIN.toLong(),
        message = "must be between ${PaginationRules.SIZE_MIN} and ${PaginationRules.SIZE_MAX}",
    )
    @field:Max(
        value = PaginationRules.SIZE_MAX.toLong(),
        message = "must be between ${PaginationRules.SIZE_MIN} and ${PaginationRules.SIZE_MAX}",
    )
    val size: Int = PaginationRules.DEFAULT_SIZE,
)
