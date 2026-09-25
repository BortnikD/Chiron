package com.bortnik.chiron.domain.dto.pagination

// totalElements counts every row that matches the filter, not only the rows on this page.
data class Page<T>(
    val items: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
) {
    val totalPages: Long get() = (totalElements + size - 1) / size
}
