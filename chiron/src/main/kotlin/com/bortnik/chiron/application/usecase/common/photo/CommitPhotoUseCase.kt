package com.bortnik.chiron.application.usecase.common.photo

import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.photo.PhotoOwner
import com.bortnik.chiron.domain.photo.PhotoRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class CommitPhotoUseCase(private val repository: PhotoRepository) {
    @Transactional
    fun commit(owner: PhotoOwner, id: UUID, key: String?) {
        // The same lock prevents cleanup from racing a late upload commit.
        if (key != null) check(repository.lockCleanup(key)) { "Photo upload expired; retry the upload" }
        if (!repository.setPhoto(owner, id, key)) {
            when (owner) {
                PhotoOwner.PET -> throw PetNotFoundException(id)
                PhotoOwner.VETERINARIAN -> throw VeterinarianNotFoundException(id)
            }
        }
        if (key != null) repository.completeCleanup(key)
    }
}
