package com.bortnik.chiron.infrastructure.security.jwt

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

@ConfigurationProperties(prefix = "jwt")
data class JwtProperties(
    // Base64-encoded HMAC-SHA key of at least 256 bits.
    val secret: String,
    val ttl: Duration,
)
