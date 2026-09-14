package com.bortnik.chiron.application.config

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.ZoneId

@ConfigurationProperties(prefix = "clinic")
data class ClinicProperties(
    val zone: String,
    val slotStepMin: Int,
) {
    val zoneId: ZoneId
        get() = ZoneId.of(zone)
}
