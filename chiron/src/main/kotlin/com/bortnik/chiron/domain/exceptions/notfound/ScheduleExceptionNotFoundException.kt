package com.bortnik.chiron.domain.exceptions.notfound

import com.bortnik.chiron.domain.exceptions.EntityNotFoundException
import java.util.UUID

class ScheduleExceptionNotFoundException(criteria: Map<String, Any?>) : EntityNotFoundException(ENTITY_NAME, criteria) {

    constructor(id: UUID) : this(mapOf("id" to id))

    constructor(field: String, value: Any?) : this(mapOf(field to value))

    companion object {
        const val ENTITY_NAME = "ScheduleException"
    }
}
