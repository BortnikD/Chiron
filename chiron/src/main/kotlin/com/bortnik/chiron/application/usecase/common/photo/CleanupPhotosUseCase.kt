package com.bortnik.chiron.application.usecase.common.photo

import com.bortnik.chiron.domain.photo.PhotoRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class CleanupPhotosUseCase(private val repository: PhotoRepository, private val cleanup: CleanupPhotoUseCase) {
    private val log = LoggerFactory.getLogger(javaClass)

    fun run() {
        for (key in repository.pendingCleanup()) {
            try {
                cleanup.delete(key)
            } catch (ex: Exception) {
                log.warn("Photo cleanup failed for {}; it will be retried", key, ex)
            }
        }
    }
}
