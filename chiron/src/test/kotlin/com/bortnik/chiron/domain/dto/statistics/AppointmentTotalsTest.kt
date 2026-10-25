package com.bortnik.chiron.domain.dto.statistics

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class AppointmentTotalsTest {

    @Test
    fun `revenue counts only completed appointments`() {
        val totals = totals(
            AppointmentStatus.COMPLETED to (2L to 300.0),
            AppointmentStatus.PENDING to (1L to 100.0),
            AppointmentStatus.CONFIRMED to (1L to 50.0),
            AppointmentStatus.CANCELLED to (1L to 70.0),
        )

        assertEquals(5L, totals.total)
        assertEquals(300.0, totals.revenue)
        assertEquals(150.0, totals.expectedRevenue)
        assertEquals(150.0, totals.averageCheck)
    }

    @Test
    fun `no-show rate is measured against completed and missed appointments`() {
        val totals = totals(
            AppointmentStatus.COMPLETED to (3L to 0.0),
            AppointmentStatus.NO_SHOW to (1L to 0.0),
            AppointmentStatus.CANCELLED to (4L to 0.0),
        )

        assertEquals(0.25, totals.noShowRate)
        assertEquals(0.5, totals.cancellationRate)
    }

    @Test
    fun `empty totals have zero sums and no rates`() {
        val totals = AppointmentTotals()

        assertEquals(0L, totals.total)
        assertEquals(0L, totals.count(AppointmentStatus.COMPLETED))
        assertEquals(0.0, totals.revenue)
        assertNull(totals.averageCheck)
        assertNull(totals.cancellationRate)
        assertNull(totals.noShowRate)
    }

    private fun totals(vararg groups: Pair<AppointmentStatus, Pair<Long, Double>>) = AppointmentTotals(
        countByStatus = groups.associate { (status, group) -> status to group.first },
        priceByStatus = groups.associate { (status, group) -> status to group.second },
    )
}
