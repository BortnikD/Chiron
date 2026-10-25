package com.bortnik.chiron.application.notification

import com.bortnik.chiron.domain.entities.enums.NotificationType
import org.junit.jupiter.api.Test
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlin.test.assertEquals

class NotificationMessagesTest {

    @Test
    fun `appointment time is rendered in the clinic time zone`() {
        // 21:30 UTC is already the next day in Moscow.
        val text = NotificationMessages.forAppointment(
            NotificationType.APPOINTMENT_BOOKED,
            details(startAt = Instant.parse("2026-10-26T21:30:00Z")),
            ZONE,
        )

        assertEquals("Новая запись на приём", text.title)
        assertEquals("Барсик — Общий осмотр, 27.10.2026 в 00:30, врач А. С. Иванова.", text.body)
    }

    @Test
    fun `cancellation adds the reason without a doubled period`() {
        val text = NotificationMessages.forAppointment(
            NotificationType.APPOINTMENT_CANCELLED,
            details(cancelReason = "Заболел."),
            ZONE,
        )

        assertEquals("Барсик — Общий осмотр, 27.10.2026 в 10:30, врач А. С. Иванова. Причина: Заболел.", text.body)
    }

    @Test
    fun `cancellation without a reason has no reason part`() {
        val text = NotificationMessages.forAppointment(
            NotificationType.APPOINTMENT_CANCELLED,
            details(cancelReason = "  "),
            ZONE,
        )

        assertEquals("Барсик — Общий осмотр, 27.10.2026 в 10:30, врач А. С. Иванова.", text.body)
    }

    @Test
    fun `vaccination due names the pet, the vaccine and the date`() {
        val text = NotificationMessages.forVaccinationDue("Барсик", "Бешенство", LocalDate.of(2026, 11, 1))

        assertEquals("Скоро ревакцинация", text.title)
        assertEquals("Барсик: срок ревакцинации «Бешенство» — 01.11.2026.", text.body)
    }

    private fun details(
        startAt: Instant = Instant.parse("2026-10-27T07:30:00Z"),
        cancelReason: String? = null,
    ) = AppointmentNotificationDetails(
        petName = "Барсик",
        serviceName = "Общий осмотр",
        veterinarianName = "А. С. Иванова",
        startAt = startAt,
        cancelReason = cancelReason,
    )

    private companion object {
        val ZONE: ZoneId = ZoneId.of("Europe/Moscow")
    }
}
