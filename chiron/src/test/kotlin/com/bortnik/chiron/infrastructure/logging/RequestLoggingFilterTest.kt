package com.bortnik.chiron.infrastructure.logging

import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.read.ListAppender
import jakarta.servlet.FilterChain
import jakarta.servlet.ServletException
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.slf4j.LoggerFactory
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertSame
import kotlin.test.assertTrue

class RequestLoggingFilterTest {
    private val log = LoggerFactory.getLogger(RequestLoggingFilter::class.java) as Logger
    private val appender = ListAppender<ILoggingEvent>()
    private val filter = RequestLoggingFilter()

    @BeforeEach
    fun attachAppender() {
        appender.start()
        log.addAppender(appender)
    }

    @AfterEach
    fun detachAppender() {
        log.detachAppender(appender)
        appender.stop()
    }

    @Test
    fun `logs only request metadata without consuming bodies or exposing sensitive values`() {
        val body = """{"password":"private-password"}"""
        val responseBody = """{"accessToken":"private-token"}"""
        val request = MockHttpServletRequest("POST", "/api/v1/auth/login").apply {
            queryString = "email=private@example.invalid"
            addHeader("Authorization", "Bearer private-header-token")
            addHeader("Cookie", "session=private-session")
            contentType = "application/json"
            setContent(body.toByteArray())
        }
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, FilterChain { downstream, _ ->
            assertEquals(body, downstream.reader.readText())
            response.status = 200
            response.writer.write(responseBody)
        })

        assertTrue(
            Regex("POST /api/v1/auth/login -> 200 \\(\\d+ ms\\)").matches(appender.list.single().formattedMessage),
        )
        assertEquals(responseBody, response.contentAsString)
    }

    @Test
    fun `logs final success redirect and error statuses exactly once`() {
        for (status in listOf(201, 204, 302, 401, 403, 404, 500)) {
            appender.list.clear()
            val request = MockHttpServletRequest("GET", "/api/v1/services")
            val response = MockHttpServletResponse()

            filter.doFilter(request, response, FilterChain { _, _ -> response.status = status })

            assertTrue(
                Regex("GET /api/v1/services -> $status \\(\\d+ ms\\)").matches(appender.list.single().formattedMessage),
            )
        }
    }

    @Test
    fun `logs unhandled exceptions as server errors and propagates them without exposing their message`() {
        val request = MockHttpServletRequest("GET", "/api/v1/services")
        val response = MockHttpServletResponse()
        val failure = ServletException("private-error-details")

        val thrown = assertFailsWith<ServletException> {
            filter.doFilter(request, response, FilterChain { _, _ -> throw failure })
        }

        assertSame(failure, thrown)
        assertTrue(
            Regex("GET /api/v1/services -> 500 \\(\\d+ ms\\)").matches(appender.list.single().formattedMessage),
        )
        assertNull(appender.list.single().throwableProxy)
    }
}
