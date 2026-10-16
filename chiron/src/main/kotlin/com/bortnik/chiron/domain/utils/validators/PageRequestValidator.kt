package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.utils.ValidationConstants.PaginationRules

object PageRequestValidator {

    fun validate(pageRequest: PageRequest) = validateAll {
        ensure(pageRequest.page >= 0, "page", "must not be negative")
        ensureInRange("size", pageRequest.size, PaginationRules.SIZE_MIN, PaginationRules.SIZE_MAX)
    }
}
