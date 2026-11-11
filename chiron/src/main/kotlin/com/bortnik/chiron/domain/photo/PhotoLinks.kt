package com.bortnik.chiron.domain.photo

import java.time.Instant

data class PhotoLinks(
    val photoUrl: String,
    val photoThumbnailUrl: String,
    val photoUrlExpiresAt: Instant,
)
