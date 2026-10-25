package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.statistics.StatisticsPeriod

object StatisticsValidator {

    fun validate(period: StatisticsPeriod) = validateAll {
        ensureNotBefore("to", period.to, "from", period.from)
    }
}
