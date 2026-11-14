package com.bortnik.chiron.infrastructure.persistence.models

import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable

object ExposedSpeciesTable : UUIDTable("species") {
    val name = text("name")
    val color = text("color").nullable()
    val iconKey = text("icon_key").nullable()
}
