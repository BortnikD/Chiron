package com.bortnik.chiron.domain.exceptions.alreadyexists

import com.bortnik.chiron.domain.exceptions.EntityAlreadyExistsException
import java.util.UUID

class ServiceSpeciesAlreadyExistsException(criteria: Map<String, Any?>) : EntityAlreadyExistsException(ENTITY_NAME, criteria) {

    constructor(serviceId: UUID, speciesId: UUID) : this(mapOf("serviceId" to serviceId, "speciesId" to speciesId))

    companion object {
        const val ENTITY_NAME = "ServiceSpecies"
    }
}
