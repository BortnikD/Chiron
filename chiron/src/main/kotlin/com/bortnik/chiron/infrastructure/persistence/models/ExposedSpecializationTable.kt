package com.bortnik.chiron.infrastructure.persistence.models

import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable

object ExposedSpecializationTable : UUIDTable("specialization") {
    val name = text("name")
    val description = text("description")
}
