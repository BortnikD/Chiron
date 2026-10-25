package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.statistics.AppointmentTotals
import com.bortnik.chiron.domain.dto.statistics.OverviewStatistics
import com.bortnik.chiron.domain.dto.statistics.ServiceStatistics
import com.bortnik.chiron.domain.dto.statistics.SpeciesStatistics
import com.bortnik.chiron.domain.dto.statistics.StatisticsGranularity
import com.bortnik.chiron.domain.dto.statistics.StatisticsPeriod
import com.bortnik.chiron.domain.dto.statistics.TimelinePoint
import com.bortnik.chiron.domain.dto.statistics.VeterinarianStatistics
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.repositories.StatisticsRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbTimestamp
import com.bortnik.chiron.infrastructure.persistence.models.ExposedAppointmentTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedPetTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedServiceTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedSpecializationTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedSpeciesTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedUserTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVeterinarianTable
import com.bortnik.chiron.infrastructure.persistence.utils.ClinicDateTrunc
import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.count
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.isNotNull
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.core.sum
import org.jetbrains.exposed.v1.jdbc.Query
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

// Appointment aggregates are grouped by status as well, so one query yields every count and price sum of a group;
// AppointmentTotals derives revenue and rates from them.
@Repository
@Transactional
class ExposedStatisticsRepository : StatisticsRepository {

    private val appointmentCount = ExposedAppointmentTable.id.count()
    private val priceSum = ExposedAppointmentTable.priceSnapshot.sum()

    override fun findOverview(period: StatisticsPeriod): OverviewStatistics = exposedSql {
        OverviewStatistics(
            appointments = ExposedAppointmentTable
                .select(ExposedAppointmentTable.status, appointmentCount, priceSum)
                .where { ExposedAppointmentTable.startAt.within(period) }
                .groupBy(ExposedAppointmentTable.status)
                .toList()
                .toTotals(),
            followUps = ExposedAppointmentTable.selectAll()
                .where {
                    ExposedAppointmentTable.startAt.within(period) and ExposedAppointmentTable.followUpOf.isNotNull()
                }
                .count(),
            newClients = ExposedUserTable.selectAll()
                .where { (ExposedUserTable.role eq UserRole.CLIENT) and ExposedUserTable.createdAt.within(period) }
                .count(),
            newPets = ExposedPetTable.selectAll()
                .where { ExposedPetTable.createdAt.within(period) }
                .count(),
        )
    }

    override fun findTimeline(period: StatisticsPeriod, granularity: StatisticsGranularity): List<TimelinePoint> =
        exposedSql {
            val periodStart = ClinicDateTrunc(ExposedAppointmentTable.startAt, granularity, period.zone)
            ExposedAppointmentTable
                .select(periodStart, ExposedAppointmentTable.status, appointmentCount, priceSum)
                .where { ExposedAppointmentTable.startAt.within(period) }
                .groupBy(periodStart, ExposedAppointmentTable.status)
                .toTotalsBy { it[periodStart] }
                .map { (start, totals) -> TimelinePoint(periodStart = start, appointments = totals) }
                .sortedBy { it.periodStart }
        }

    override fun findByVeterinarian(period: StatisticsPeriod): List<VeterinarianStatistics> = exposedSql {
        ExposedAppointmentTable
            .join(
                ExposedVeterinarianTable,
                JoinType.INNER,
                ExposedAppointmentTable.veterinarianId,
                ExposedVeterinarianTable.id,
            )
            // Explicit columns: appointment.cancelled_by also references users.
            .join(ExposedUserTable, JoinType.INNER, ExposedVeterinarianTable.userId, ExposedUserTable.id)
            .select(
                ExposedAppointmentTable.veterinarianId,
                ExposedUserTable.fullName,
                ExposedAppointmentTable.status,
                appointmentCount,
                priceSum,
            )
            .where { ExposedAppointmentTable.startAt.within(period) }
            .groupBy(ExposedAppointmentTable.veterinarianId, ExposedUserTable.fullName, ExposedAppointmentTable.status)
            .toTotalsBy { it[ExposedAppointmentTable.veterinarianId].value to it[ExposedUserTable.fullName] }
            .map { (veterinarian, totals) ->
                VeterinarianStatistics(
                    veterinarianId = veterinarian.first,
                    fullName = veterinarian.second,
                    appointments = totals,
                )
            }
            .sortedByRevenue({ it.appointments }, { it.fullName })
    }

    override fun findByService(period: StatisticsPeriod): List<ServiceStatistics> = exposedSql {
        ExposedAppointmentTable
            .join(ExposedServiceTable, JoinType.INNER, ExposedAppointmentTable.serviceId, ExposedServiceTable.id)
            .join(
                ExposedSpecializationTable,
                JoinType.INNER,
                ExposedServiceTable.specializationId,
                ExposedSpecializationTable.id,
            )
            .select(
                ExposedAppointmentTable.serviceId,
                ExposedServiceTable.name,
                ExposedSpecializationTable.name,
                ExposedAppointmentTable.status,
                appointmentCount,
                priceSum,
            )
            .where { ExposedAppointmentTable.startAt.within(period) }
            .groupBy(
                ExposedAppointmentTable.serviceId,
                ExposedServiceTable.name,
                ExposedSpecializationTable.name,
                ExposedAppointmentTable.status,
            )
            .toTotalsBy {
                Triple(
                    it[ExposedAppointmentTable.serviceId].value,
                    it[ExposedServiceTable.name],
                    it[ExposedSpecializationTable.name],
                )
            }
            .map { (service, totals) ->
                ServiceStatistics(
                    serviceId = service.first,
                    name = service.second,
                    specializationName = service.third,
                    appointments = totals,
                )
            }
            .sortedByRevenue({ it.appointments }, { it.name })
    }

    override fun findBySpecies(period: StatisticsPeriod): List<SpeciesStatistics> = exposedSql {
        val totalsBySpecies = ExposedAppointmentTable
            .join(ExposedPetTable, JoinType.INNER, ExposedAppointmentTable.petId, ExposedPetTable.id)
            .select(ExposedPetTable.speciesId, ExposedAppointmentTable.status, appointmentCount, priceSum)
            .where { ExposedAppointmentTable.startAt.within(period) }
            .groupBy(ExposedPetTable.speciesId, ExposedAppointmentTable.status)
            .toTotalsBy { it[ExposedPetTable.speciesId].value }

        val activePets = ExposedPetTable.id.count()
        ExposedSpeciesTable
            .join(ExposedPetTable, JoinType.LEFT, ExposedSpeciesTable.id, ExposedPetTable.speciesId) {
                ExposedPetTable.isArchived eq false
            }
            .select(ExposedSpeciesTable.id, ExposedSpeciesTable.name, activePets)
            .groupBy(ExposedSpeciesTable.id, ExposedSpeciesTable.name)
            .map {
                val speciesId = it[ExposedSpeciesTable.id].value
                SpeciesStatistics(
                    speciesId = speciesId,
                    name = it[ExposedSpeciesTable.name],
                    activePets = it[activePets],
                    appointments = totalsBySpecies[speciesId] ?: AppointmentTotals(),
                )
            }
            .sortedByRevenue({ it.appointments }, { it.name })
    }

    private fun Column<OffsetDateTime>.within(period: StatisticsPeriod): Op<Boolean> =
        (this greaterEq period.start.toDbTimestamp()) and (this less period.end.toDbTimestamp())

    // Rows of a query grouped by (key columns, status) folded into one AppointmentTotals per key.
    private fun <K> Query.toTotalsBy(key: (ResultRow) -> K): Map<K, AppointmentTotals> =
        toList().groupBy(key).mapValues { (_, rows) -> rows.toTotals() }

    // One row per status of the same group.
    private fun List<ResultRow>.toTotals(): AppointmentTotals = AppointmentTotals(
        countByStatus = associate { it[ExposedAppointmentTable.status] to it[appointmentCount] },
        priceByStatus = associate { it[ExposedAppointmentTable.status] to (it[priceSum]?.toDouble() ?: 0.0) },
    )

    private fun <T> List<T>.sortedByRevenue(totals: (T) -> AppointmentTotals, name: (T) -> String): List<T> =
        sortedWith(compareByDescending<T> { totals(it).revenue }.thenBy(name))
}
