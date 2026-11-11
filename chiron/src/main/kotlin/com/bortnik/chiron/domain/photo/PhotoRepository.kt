package com.bortnik.chiron.domain.photo

import java.util.UUID

interface PhotoRepository {
    fun stage(photoKey: String)
    fun lockCleanup(photoKey: String): Boolean
    fun setPhoto(owner: PhotoOwner, id: UUID, photoKey: String?): Boolean
    fun completeCleanup(photoKey: String)
    fun pendingCleanup(): List<String>
}
