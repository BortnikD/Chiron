package com.bortnik.chiron.presentation.api.http.dto.request.statistics

import io.swagger.v3.oas.annotations.Parameter
import java.time.LocalDate

data class StatisticsPeriodRequest(
    @field:Parameter(
        description = "First date of the period, ISO-8601 date in the clinic time zone. " +
            "Defaults to the first day of the month of `to`, or of the current month",
    )
    val from: LocalDate? = null,
    @field:Parameter(
        description = "Last date of the period, inclusive, ISO-8601 date in the clinic time zone. " +
            "Defaults to the last day of the month of `from`, or of the current month",
    )
    val to: LocalDate? = null,
)
