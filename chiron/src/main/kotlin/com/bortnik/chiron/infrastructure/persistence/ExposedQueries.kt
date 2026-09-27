package com.bortnik.chiron.infrastructure.persistence

import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import org.jetbrains.exposed.v1.core.Expression
import org.jetbrains.exposed.v1.core.LikePattern
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.jdbc.Query

// Counts every matching row, then reads one page. The order must end with a unique column so that
// rows do not move between pages.
fun <T> Query.toPage(
    pageRequest: PageRequest,
    vararg order: Pair<Expression<*>, SortOrder>,
    transform: (ResultRow) -> T,
): Page<T> {
    val totalElements = count()
    val items = orderBy(*order)
        .limit(pageRequest.size)
        .offset(pageRequest.offset)
        .map(transform)
    return Page(items, pageRequest.page, pageRequest.size, totalElements)
}

// Case-insensitive substring match; % and _ in the text are matched literally.
fun <T : String?> Expression<T>.containsIgnoreCase(text: String): Op<Boolean> {
    val literal = LikePattern.ofLiteral(text.lowercase())
    return lowerCase() like LikePattern("%${literal.pattern}%", literal.escapeChar)
}
