package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pagination.PaginationRequest
import com.bortnik.chiron.presentation.api.http.dto.response.PageResponse

fun PaginationRequest.toDto(): PageRequest = PageRequest(page = page, size = size)

fun <T, R> Page<T>.toResponse(transform: (T) -> R): PageResponse<R> = PageResponse(
    items = items.map(transform),
    page = page,
    size = size,
    totalElements = totalElements,
    totalPages = totalPages,
)
