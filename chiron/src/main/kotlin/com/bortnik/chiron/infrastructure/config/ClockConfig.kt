package com.bortnik.chiron.infrastructure.config

import com.bortnik.chiron.application.config.ClinicProperties
import org.springframework.boot.validation.autoconfigure.ValidationConfigurationCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.time.Clock

@Configuration
class ClockConfig {
    @Bean
    fun clock(clinicProperties: ClinicProperties): Clock = Clock.system(clinicProperties.zoneId)

    @Bean
    fun validationClock(clock: Clock): ValidationConfigurationCustomizer =
        ValidationConfigurationCustomizer { it.clockProvider { clock } }
}
