package com.bortnik.chiron.application.usecase.admin.statistics

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.domain.dto.statistics.AppointmentTotals
import com.bortnik.chiron.domain.dto.statistics.OverviewStatistics
import com.bortnik.chiron.domain.dto.statistics.ServiceStatistics
import com.bortnik.chiron.domain.dto.statistics.SpeciesStatistics
import com.bortnik.chiron.domain.dto.statistics.StatisticsGranularity
import com.bortnik.chiron.domain.dto.statistics.StatisticsPeriod
import com.bortnik.chiron.domain.dto.statistics.TimelinePoint
import com.bortnik.chiron.domain.dto.statistics.VeterinarianStatistics
import com.bortnik.chiron.domain.repositories.StatisticsRepository
import com.bortnik.chiron.domain.utils.validators.StatisticsValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

// from / to are clinic-local dates, both inclusive; without them the current month is used.
@Service
@Transactional(readOnly = true)
class AdminGetStatisticsUseCase(
    private val statisticsRepository: StatisticsRepository,
    private val clinicProperties: ClinicProperties,
) {

    fun getOverview(from: LocalDate?, to: LocalDate?): OverviewStatistics =
        statisticsRepository.findOverview(periodOf(from, to))

    // Buckets without appointments are filled with zeros, so a chart has no gaps.
    fun getTimeline(from: LocalDate?, to: LocalDate?, granularity: StatisticsGranularity): List<TimelinePoint> {
        val period = periodOf(from, to)
        val pointsByStart = statisticsRepository.findTimeline(period, granularity).associateBy { it.periodStart }
        return period.bucketStarts(granularity).map {
            pointsByStart[it] ?: TimelinePoint(periodStart = it, appointments = AppointmentTotals())
        }
    }

    fun getVeterinarians(from: LocalDate?, to: LocalDate?): List<VeterinarianStatistics> =
        statisticsRepository.findByVeterinarian(periodOf(from, to))

    fun getServices(from: LocalDate?, to: LocalDate?): List<ServiceStatistics> =
        statisticsRepository.findByService(periodOf(from, to))

    fun getSpecies(from: LocalDate?, to: LocalDate?): List<SpeciesStatistics> =
        statisticsRepository.findBySpecies(periodOf(from, to))

    private fun periodOf(from: LocalDate?, to: LocalDate?): StatisticsPeriod =
        StatisticsPeriod.of(from, to, clinicProperties.zoneId).also { StatisticsValidator.validate(it) }
}
