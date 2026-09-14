package com.bortnik.chiron.domain.exceptions.notfound

import com.bortnik.chiron.domain.exceptions.EntityNotFoundException
import java.util.UUID

class ServiceSpeciesNotFoundException(criteria: Map<String, Any?>) : EntityNotFoundException(ENTITY_NAME, criteria) {

    constructor(serviceId: UUID, speciesId: UUID) : this(mapOf("serviceId" to serviceId, "speciesId" to speciesId))

    companion object {
        const val ENTITY_NAME = "ServiceSpecies"
    }
}
