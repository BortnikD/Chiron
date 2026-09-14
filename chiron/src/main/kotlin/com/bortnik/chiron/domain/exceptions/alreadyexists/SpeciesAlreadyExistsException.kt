package com.bortnik.chiron.domain.exceptions.alreadyexists

import com.bortnik.chiron.domain.exceptions.EntityAlreadyExistsException

class SpeciesAlreadyExistsException(criteria: Map<String, Any?>) : EntityAlreadyExistsException(ENTITY_NAME, criteria) {

    constructor(field: String, value: Any?) : this(mapOf(field to value))

    companion object {
        const val ENTITY_NAME = "Species"

        fun byName(name: String) = SpeciesAlreadyExistsException("name", name)
    }
}
