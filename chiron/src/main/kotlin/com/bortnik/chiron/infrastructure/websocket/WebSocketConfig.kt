package com.bortnik.chiron.infrastructure.websocket

import com.bortnik.chiron.infrastructure.config.CorsProperties
import org.springframework.context.annotation.Configuration
import org.springframework.messaging.simp.config.ChannelRegistration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

// STOMP over a plain WebSocket (no SockJS fallback). Messages only flow from the server to the clients: the in-memory
// broker serves the per-user queues and there are no application destinations. The in-memory broker limits the
// application to a single instance; several instances would need a broker relay (e.g. RabbitMQ).
@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(
    private val corsProperties: CorsProperties,
    private val stompAuthenticationInterceptor: StompAuthenticationInterceptor,
) : WebSocketMessageBrokerConfigurer {

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint(ENDPOINT).setAllowedOrigins(*corsProperties.allowedOrigins.toTypedArray())
        registry.setErrorHandler(StompErrorHandler())
    }

    override fun configureMessageBroker(registry: MessageBrokerRegistry) {
        registry.enableSimpleBroker(QUEUE_PREFIX)
    }

    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        registration.interceptors(stompAuthenticationInterceptor)
    }

    companion object {
        const val ENDPOINT = "/ws"
        const val QUEUE_PREFIX = "/queue"

        // /user/queue/... is resolved to the queue of the connected user's own session.
        const val USER_QUEUE_PREFIX = "/user$QUEUE_PREFIX/"
    }
}
