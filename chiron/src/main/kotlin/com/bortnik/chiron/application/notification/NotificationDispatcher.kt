package com.bortnik.chiron.application.notification

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class NotificationDispatcher(private val channels: List<NotificationChannel>) {

    private val log = LoggerFactory.getLogger(javaClass)

    // After commit, so that no channel announces a notification that was rolled back or is not visible yet.
    // A failing channel is only logged: the notification stays in the inbox and the other channels still get it.
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    fun dispatch(event: NotificationCreatedEvent) {
        for (channel in channels) {
            try {
                channel.deliver(event.notification)
            } catch (e: RuntimeException) {
                log.warn(
                    "Channel {} failed to deliver notification {}",
                    channel.javaClass.simpleName,
                    event.notification.id,
                    e,
                )
            }
        }
    }
}
