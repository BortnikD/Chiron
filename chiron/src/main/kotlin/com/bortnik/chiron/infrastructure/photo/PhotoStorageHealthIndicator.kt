package com.bortnik.chiron.infrastructure.photo

import com.bortnik.chiron.domain.photo.PhotoStorage
import org.springframework.boot.health.contributor.Health
import org.springframework.boot.health.contributor.HealthIndicator
import org.springframework.stereotype.Component

@Component("photoStorage")
class PhotoStorageHealthIndicator(private val storage: PhotoStorage) : HealthIndicator {
    override fun health(): Health = try {
        storage.checkAvailability()
        Health.up().build()
    } catch (ex: Exception) {
        Health.down().build()
    }
}
