package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.statistics.OverviewStatistics
import com.bortnik.chiron.domain.dto.statistics.ServiceStatistics
import com.bortnik.chiron.domain.dto.statistics.SpeciesStatistics
import com.bortnik.chiron.domain.dto.statistics.StatisticsGranularity
import com.bortnik.chiron.domain.dto.statistics.StatisticsPeriod
import com.bortnik.chiron.domain.dto.statistics.TimelinePoint
import com.bortnik.chiron.domain.dto.statistics.VeterinarianStatistics

// Lists are sorted by revenue descending, then by name.
interface StatisticsRepository {
    fun findOverview(period: StatisticsPeriod): OverviewStatistics

    // Only buckets that have appointments, sorted by periodStart.
    fun findTimeline(period: StatisticsPeriod, granularity: StatisticsGranularity): List<TimelinePoint>

    // Only veterinarians that have appointments in the period.
    fun findByVeterinarian(period: StatisticsPeriod): List<VeterinarianStatistics>

    // Only services that have appointments in the period.
    fun findByService(period: StatisticsPeriod): List<ServiceStatistics>

    // Every species, including those without appointments in the period.
    fun findBySpecies(period: StatisticsPeriod): List<SpeciesStatistics>
}
