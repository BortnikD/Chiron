package com.bortnik.chiron.infrastructure.websocket

import com.bortnik.chiron.application.security.toActor
import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.exceptions.UnauthenticatedException
import com.bortnik.chiron.infrastructure.security.JwtActorResolver
import com.bortnik.chiron.support.TestEntities.user
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.springframework.http.HttpHeaders
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.MessageBuilder
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertSame

class StompAuthenticationInterceptorTest {
    private val resolver = mock(JwtActorResolver::class.java)
    private val channel = mock(MessageChannel::class.java)
    private val interceptor = StompAuthenticationInterceptor(resolver)

    @Test
    fun `valid connect binds user id as the session principal`() {
        val accessor = StompHeaderAccessor.create(StompCommand.CONNECT)
        accessor.setNativeHeader(HttpHeaders.AUTHORIZATION, "Bearer token")
        `when`(resolver.resolve("Bearer token")).thenReturn(user.toActor())
        accessor.setLeaveMutable(true)
        val message = MessageBuilder.createMessage(byteArrayOf(), accessor.messageHeaders)
        assertSame(message, interceptor.preSend(message, channel))
        assertEquals(user.id.toString(), accessor.user!!.name)
    }

    @Test
    fun `missing or rejected connect token cannot authenticate`() {
        for (header in listOf(null, "Bearer expired", "Basic token")) {
            val accessor = StompHeaderAccessor.create(StompCommand.CONNECT)
            if (header != null) accessor.setNativeHeader(HttpHeaders.AUTHORIZATION, header)
            accessor.setLeaveMutable(true)
            val message = MessageBuilder.createMessage(byteArrayOf(), accessor.messageHeaders)
            assertFailsWith<UnauthenticatedException> { interceptor.preSend(message, channel) }
        }
    }

    @Test
    fun `only user queue subscriptions are permitted`() {
        for (destination in listOf(
            null,
            "/queue/notifications",
            "/topic/notifications",
            "/user/other/queue/notifications",
            "/user/queue"
        )) {
            val accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE)
            accessor.destination = destination
            val message = MessageBuilder.createMessage(byteArrayOf(), accessor.messageHeaders)
            assertFailsWith<AccessDeniedException> { interceptor.preSend(message, channel) }
        }
        val accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE)
        accessor.destination = "/user/queue/notifications"
        val message = MessageBuilder.createMessage(byteArrayOf(), accessor.messageHeaders)
        assertSame(message, interceptor.preSend(message, channel))
    }

    @Test
    fun `send is forbidden even to a user queue`() {
        val accessor = StompHeaderAccessor.create(StompCommand.SEND)
        accessor.destination = "/user/queue/notifications"
        val message = MessageBuilder.createMessage(byteArrayOf(), accessor.messageHeaders)
        assertFailsWith<AccessDeniedException> { interceptor.preSend(message, channel) }
    }
}
