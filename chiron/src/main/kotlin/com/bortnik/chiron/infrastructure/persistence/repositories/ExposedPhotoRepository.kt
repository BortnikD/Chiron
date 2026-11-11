package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.photo.PhotoOwner
import com.bortnik.chiron.domain.photo.PhotoRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.models.ExposedPetTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedPhotoCleanupTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVeterinarianTable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.javatime.CurrentTimestampWithTimeZone
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

@Repository
@Transactional
class ExposedPhotoRepository : PhotoRepository {
    override fun stage(photoKey: String): Unit = exposedSql {
        ExposedPhotoCleanupTable.insert {
            it[ExposedPhotoCleanupTable.photoKey] = photoKey
            it[availableAt] = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(10)
        }
        Unit
    }

    override fun lockCleanup(photoKey: String): Boolean = exposedSql {
        ExposedPhotoCleanupTable.selectAll().where { ExposedPhotoCleanupTable.photoKey eq photoKey }
            .forUpdate().singleOrNull() != null
    }

    override fun setPhoto(owner: PhotoOwner, id: UUID, photoKey: String?): Boolean = exposedSql {
        when (owner) {
            PhotoOwner.PET -> ExposedPetTable.update({ ExposedPetTable.id eq id }) {
                it[ExposedPetTable.photoKey] = photoKey
                it[updatedAt] = CurrentTimestampWithTimeZone
            }

            PhotoOwner.VETERINARIAN -> ExposedVeterinarianTable.update({ ExposedVeterinarianTable.id eq id }) {
                it[ExposedVeterinarianTable.photoKey] = photoKey
                it[updatedAt] = CurrentTimestampWithTimeZone
            }
        } > 0
    }

    override fun completeCleanup(photoKey: String): Unit = exposedSql {
        ExposedPhotoCleanupTable.deleteWhere { ExposedPhotoCleanupTable.photoKey eq photoKey }
        Unit
    }

    @Transactional(readOnly = true)
    override fun pendingCleanup(): List<String> = exposedSql {
        ExposedPhotoCleanupTable.selectAll().where {
            ExposedPhotoCleanupTable.availableAt lessEq CurrentTimestampWithTimeZone
        }.limit(50).map { it[ExposedPhotoCleanupTable.photoKey] }
    }
}
