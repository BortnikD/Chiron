package com.bortnik.chiron.domain.utils

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class AppointmentStatusRulesTest {

    @Test
    fun `follow-up is allowed only for confirmed and completed appointments`() {
        val allowed = AppointmentStatus.entries.filter { AppointmentStatusRules.allowsFollowUp(it) }

        assertEquals(listOf(AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED), allowed)
    }
}
