package com.bortnik.chiron.infrastructure.scheduling

import com.bortnik.chiron.application.usecase.common.photo.CleanupPhotosUseCase
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class PhotoCleanupScheduler(private val cleanup: CleanupPhotosUseCase) {
    @Scheduled(fixedDelay = 60000)
    fun cleanup() = cleanup.run()
}
