package com.bortnik.chiron.application.usecase.admin.statistics

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.domain.dto.statistics.AppointmentTotals
import com.bortnik.chiron.domain.dto.statistics.StatisticsGranularity
import com.bortnik.chiron.domain.dto.statistics.StatisticsPeriod
import com.bortnik.chiron.domain.dto.statistics.TimelinePoint
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.repositories.StatisticsRepository
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class AdminGetStatisticsUseCaseTest {
    private val repository = mock(StatisticsRepository::class.java)
    private val clinic = ClinicProperties("Europe/Moscow", 15)
    private val useCase = AdminGetStatisticsUseCase(repository, clinic)

    @Test
    fun `daily weekly and monthly timelines fill missing buckets and preserve unsorted existing values`() {
        val cases = listOf(
            Triple(StatisticsGranularity.DAY, "2026-11-03", listOf("2026-11-03", "2026-11-04", "2026-11-05")),
            Triple(StatisticsGranularity.WEEK, "2026-11-04", listOf("2026-11-02", "2026-11-09", "2026-11-16")),
            Triple(StatisticsGranularity.MONTH, "2026-09-15", listOf("2026-09-01", "2026-10-01", "2026-11-01")),
        )
        for ((granularity, from, starts) in cases) {
            val dates = starts.map(LocalDate::parse)
            val period = StatisticsPeriod(LocalDate.parse(from), dates.last(), clinic.zoneId)
            val first = TimelinePoint(dates.first(), AppointmentTotals(mapOf(AppointmentStatus.COMPLETED to 2)))
            val last = TimelinePoint(dates.last(), AppointmentTotals(mapOf(AppointmentStatus.NO_SHOW to 1)))
            `when`(repository.findTimeline(period, granularity)).thenReturn(listOf(last, first))
            assertEquals(
                listOf(first, TimelinePoint(dates[1], AppointmentTotals()), last),
                useCase.getTimeline(period.from, period.to, granularity)
            )
        }
    }

    @Test
    fun `empty repository produces a zero point for every day including the last day`() {
        val from = LocalDate.of(2026, 11, 1)
        assertEquals(
            listOf(TimelinePoint(from, AppointmentTotals()), TimelinePoint(from.plusDays(1), AppointmentTotals())),
            useCase.getTimeline(from, from.plusDays(1), StatisticsGranularity.DAY),
        )
    }

    @Test
    fun `reversed period fails before querying statistics`() {
        val day = LocalDate.of(2026, 11, 1)
        assertFailsWith<ValidationException> { useCase.getTimeline(day, day.minusDays(1), StatisticsGranularity.DAY) }
        verifyNoInteractions(repository)
    }
}
