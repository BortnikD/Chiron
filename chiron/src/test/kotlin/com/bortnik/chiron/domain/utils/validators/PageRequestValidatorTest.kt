package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.utils.ValidationConstants.PaginationRules
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class PageRequestValidatorTest {

    @Test
    fun `first page with max size is accepted`() {
        PageRequestValidator.validate(PageRequest(page = 0, size = PaginationRules.SIZE_MAX))
    }

    @Test
    fun `negative page and out of range size are both reported`() {
        val ex = assertFailsWith<ValidationException> {
            PageRequestValidator.validate(PageRequest(page = -1, size = PaginationRules.SIZE_MAX + 1))
        }

        assertEquals(listOf("page", "size"), ex.errors.map { it.field })
    }

    @Test
    fun `zero size is rejected`() {
        val ex = assertFailsWith<ValidationException> {
            PageRequestValidator.validate(PageRequest(page = 0, size = 0))
        }

        assertEquals(listOf("size"), ex.errors.map { it.field })
    }
}
