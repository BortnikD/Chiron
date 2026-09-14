package com.bortnik.chiron.domain.exceptions.alreadyexists

import com.bortnik.chiron.domain.exceptions.EntityAlreadyExistsException
import java.util.UUID

class VeterinarianAlreadyExistsException(criteria: Map<String, Any?>) : EntityAlreadyExistsException(ENTITY_NAME, criteria) {

    constructor(field: String, value: Any?) : this(mapOf(field to value))

    companion object {
        const val ENTITY_NAME = "Veterinarian"

        fun byUserId(userId: UUID) = VeterinarianAlreadyExistsException("userId", userId)
    }
}
