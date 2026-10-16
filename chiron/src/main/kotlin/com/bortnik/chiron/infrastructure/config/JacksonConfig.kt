package com.bortnik.chiron.infrastructure.config

import org.openapitools.jackson.nullable.JsonNullableJackson3Module
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import tools.jackson.databind.JacksonModule

@Configuration
class JacksonConfig {

    // Registered as a bean so the auto-configured JsonMapper gets it regardless of module auto-discovery;
    // without it JsonNullable request fields cannot tell a missing field from an explicit null.
    @Bean
    fun jsonNullableModule(): JacksonModule = JsonNullableJackson3Module()
}
