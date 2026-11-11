package com.bortnik.chiron.application.config

import org.springframework.boot.context.properties.ConfigurationProperties
import java.net.URI
import java.time.Duration

@ConfigurationProperties("storage")
data class StorageProperties(
    val endpoint: URI,
    val publicEndpoint: URI,
    val region: String,
    val bucket: String,
    val accessKey: String,
    val secretKey: String,
    val readUrlTtl: Duration,
) {
    init {
        require(!readUrlTtl.isNegative && !readUrlTtl.isZero && readUrlTtl <= Duration.ofDays(7)) {
            "storage.read-url-ttl must be between zero and seven days"
        }
    }
}
