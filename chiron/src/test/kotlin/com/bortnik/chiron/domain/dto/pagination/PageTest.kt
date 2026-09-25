package com.bortnik.chiron.domain.dto.pagination

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class PageTest {

    @Test
    fun `total pages is rounded up`() {
        assertEquals(3, page(totalElements = 41).totalPages)
    }

    @Test
    fun `total pages equals exact quotient when rows fill the last page`() {
        assertEquals(2, page(totalElements = 40).totalPages)
    }

    @Test
    fun `empty result has no pages`() {
        assertEquals(0, page(totalElements = 0).totalPages)
    }

    @Test
    fun `offset skips previous pages`() {
        assertEquals(40, PageRequest(page = 2, size = 20).offset)
    }

    private fun page(totalElements: Long) =
        Page(items = emptyList<Unit>(), page = 0, size = 20, totalElements = totalElements)
}
