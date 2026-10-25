package com.bortnik.chiron.infrastructure.websocket

import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.exceptions.UnauthenticatedException
import com.bortnik.chiron.infrastructure.security.JwtActorResolver
import org.springframework.http.HttpHeaders
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.messaging.support.MessageHeaderAccessor
import org.springframework.stereotype.Component
import java.security.Principal

// Authenticates the STOMP session once, on CONNECT, with the same bearer token as the REST API; a token that expires
// later does not close an open session. An exception thrown here is sent to the client as an ERROR frame.
@Component
class StompAuthenticationInterceptor(private val jwtActorResolver: JwtActorResolver) : ChannelInterceptor {

    override fun preSend(message: Message<*>, channel: MessageChannel): Message<*> {
        val accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor::class.java) ?: return message
        when (accessor.command) {
            StompCommand.CONNECT -> {
                val actor = jwtActorResolver.resolve(accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION))
                    ?: throw UnauthenticatedException("CONNECT requires a valid bearer token in the Authorization header")
                // convertAndSendToUser finds the sessions by Principal.getName(), so the name is the user id.
                val userId = actor.userId.toString()
                accessor.user = Principal { userId }
            }
            // Only the own user queue: a plain /queue/... destination could reach the queues of other sessions.
            StompCommand.SUBSCRIBE -> {
                val destination = accessor.destination
                if (destination == null || !destination.startsWith(WebSocketConfig.USER_QUEUE_PREFIX)) {
                    throw AccessDeniedException("Subscriptions are allowed only to ${WebSocketConfig.USER_QUEUE_PREFIX}...")
                }
            }
            StompCommand.SEND -> throw AccessDeniedException("Clients cannot send messages")
            else -> Unit
        }
        return message
    }
}
