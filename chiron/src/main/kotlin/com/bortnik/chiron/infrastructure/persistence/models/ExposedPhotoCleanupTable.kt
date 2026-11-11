package com.bortnik.chiron.infrastructure.persistence.models

import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.javatime.timestampWithTimeZone

object ExposedPhotoCleanupTable : Table("photo_cleanup") {
    val photoKey = text("photo_key")
    val availableAt = timestampWithTimeZone("available_at")
    override val primaryKey = PrimaryKey(photoKey)
}
