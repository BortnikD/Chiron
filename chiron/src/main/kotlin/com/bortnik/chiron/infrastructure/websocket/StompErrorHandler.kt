package com.bortnik.chiron.infrastructure.websocket

import com.bortnik.chiron.domain.exceptions.DomainException
import org.springframework.messaging.Message
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler

// Spring wraps an exception thrown by an inbound interceptor into a generic MessageDeliveryException, so the client
// would only see "Failed to send message ...". Domain exceptions (rejected token, forbidden subscription) carry
// a message meant for the client and are reported as is; any other error keeps the generic text.
class StompErrorHandler : StompSubProtocolErrorHandler() {

    override fun handleClientMessageProcessingError(
        clientMessage: Message<ByteArray>?,
        ex: Throwable,
    ): Message<ByteArray>? {
        val domainException = generateSequence(ex) { it.cause }.filterIsInstance<DomainException>().firstOrNull()
        return super.handleClientMessageProcessingError(clientMessage, domainException ?: ex)
    }
}
