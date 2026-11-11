package com.bortnik.chiron.application.usecase.common.photo

import com.bortnik.chiron.domain.photo.PhotoRepository
import com.bortnik.chiron.domain.photo.PhotoStorage
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CleanupPhotoUseCase(private val repository: PhotoRepository, private val storage: PhotoStorage) {
    @Transactional
    fun delete(key: String) {
        if (!repository.lockCleanup(key)) return
        storage.delete("$key/64.jpg")
        storage.delete("$key/512.jpg")
        repository.completeCleanup(key)
    }
}
