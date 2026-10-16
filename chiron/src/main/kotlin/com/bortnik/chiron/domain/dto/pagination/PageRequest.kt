package com.bortnik.chiron.domain.dto.pagination

// Zero-based page number and page size.
data class PageRequest(
    val page: Int,
    val size: Int,
) {
    val offset: Long get() = page.toLong() * size
}
