package com.bortnik.chiron.presentation.api.http.dto.response

data class PageResponse<T>(
    val items: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Long,
)
