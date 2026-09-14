package com.bortnik.chiron.domain.exceptions

open class EntityAlreadyExistsException(
    val entityName: String,
    val criteria: Map<String, Any?>,
) : DomainException("$entityName already exists: ${criteria.entries.joinToString { (key, value) -> "$key=$value" }}") {

    constructor(entityName: String, field: String, value: Any?) : this(entityName, mapOf(field to value))
}
