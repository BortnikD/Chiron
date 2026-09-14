package com.bortnik.chiron.infrastructure.persistence.mappers

import java.math.BigDecimal
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneOffset

internal fun Double.toDbDecimal(): BigDecimal = BigDecimal.valueOf(this)

internal fun Instant.toDbTimestamp(): OffsetDateTime = atOffset(ZoneOffset.UTC)
