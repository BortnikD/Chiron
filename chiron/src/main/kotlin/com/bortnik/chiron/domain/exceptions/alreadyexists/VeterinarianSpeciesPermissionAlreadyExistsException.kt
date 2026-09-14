package com.bortnik.chiron.domain.exceptions.alreadyexists

import com.bortnik.chiron.domain.exceptions.EntityAlreadyExistsException
import java.util.UUID

class VeterinarianSpeciesPermissionAlreadyExistsException(criteria: Map<String, Any?>) : EntityAlreadyExistsException(ENTITY_NAME, criteria) {

    constructor(veterinarianId: UUID, speciesId: UUID) : this(mapOf("veterinarianId" to veterinarianId, "speciesId" to speciesId))

    companion object {
        const val ENTITY_NAME = "VeterinarianSpeciesPermission"
    }
}
