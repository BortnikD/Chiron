package com.bortnik.chiron.infrastructure.persistence.utils

import com.bortnik.chiron.domain.dto.statistics.StatisticsGranularity
import org.jetbrains.exposed.v1.core.Expression
import org.jetbrains.exposed.v1.core.ExpressionWithColumnType
import org.jetbrains.exposed.v1.core.IColumnType
import org.jetbrains.exposed.v1.core.QueryBuilder
import org.jetbrains.exposed.v1.core.append
import org.jetbrains.exposed.v1.javatime.JavaLocalDateColumnType
import java.time.LocalDate
import java.time.ZoneId

// CAST(date_trunc(unit, timestamp AT TIME ZONE zone) AS DATE): the clinic-local date the bucket starts on.
// unit and zone are inlined instead of bound: PostgreSQL treats every bound parameter as a separate value, so the
// expression in SELECT would not match the one in GROUP BY. Both come from an enum and the clinic config.
// The zone must be a region id (Europe/Moscow): PostgreSQL reads a bare offset like +03:00 with the inverted sign.
internal class ClinicDateTrunc(
    private val timestamp: Expression<*>,
    private val granularity: StatisticsGranularity,
    private val zone: ZoneId,
) : ExpressionWithColumnType<LocalDate>() {
    override val columnType: IColumnType<LocalDate> = JavaLocalDateColumnType()

    override fun toQueryBuilder(queryBuilder: QueryBuilder) = queryBuilder {
        append(
            "CAST(date_trunc('",
            granularity.name.lowercase(),
            "', ",
            timestamp,
            " AT TIME ZONE '",
            zone.id,
            "') AS DATE)",
        )
    }
}
