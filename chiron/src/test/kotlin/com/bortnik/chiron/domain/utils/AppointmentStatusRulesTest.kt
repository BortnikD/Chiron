package com.bortnik.chiron.domain.utils

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class AppointmentStatusRulesTest {

    @Test
    fun `only specified transitions and unchanged statuses are allowed`() {
        val transitions = setOf(
            AppointmentStatus.PENDING to AppointmentStatus.CONFIRMED,
            AppointmentStatus.PENDING to AppointmentStatus.CANCELLED,
            AppointmentStatus.CONFIRMED to AppointmentStatus.COMPLETED,
            AppointmentStatus.CONFIRMED to AppointmentStatus.CANCELLED,
            AppointmentStatus.CONFIRMED to AppointmentStatus.NO_SHOW,
        )
        for (from in AppointmentStatus.entries) {
            for (to in AppointmentStatus.entries) {
                assertEquals(from == to || (from to to) in transitions, AppointmentStatusRules.canTransition(from, to))
            }
        }
    }

    @Test
    fun `follow-up is allowed only for confirmed and completed appointments`() {
        val allowed = AppointmentStatus.entries.filter { AppointmentStatusRules.allowsFollowUp(it) }

        assertEquals(listOf(AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED), allowed)
    }
}
