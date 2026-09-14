package com.bortnik.chiron.domain.exceptions

import java.util.UUID

open class EntityNotFoundException(
    val entityName: String,
    val criteria: Map<String, Any?>,
) : DomainException("$entityName not found: ${criteria.entries.joinToString { (key, value) -> "$key=$value" }}") {

    constructor(entityName: String, id: UUID) : this(entityName, mapOf("id" to id))
}
