package com.bortnik.chiron.domain.exceptions.notfound

import com.bortnik.chiron.domain.exceptions.EntityNotFoundException
import java.util.UUID

class VeterinarianSpeciesPermissionNotFoundException(criteria: Map<String, Any?>) : EntityNotFoundException(ENTITY_NAME, criteria) {

    constructor(veterinarianId: UUID, speciesId: UUID) : this(mapOf("veterinarianId" to veterinarianId, "speciesId" to speciesId))

    companion object {
        const val ENTITY_NAME = "VeterinarianSpeciesPermission"
    }
}
