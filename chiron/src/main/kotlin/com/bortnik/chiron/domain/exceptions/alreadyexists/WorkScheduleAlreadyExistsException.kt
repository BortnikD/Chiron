package com.bortnik.chiron.domain.exceptions.alreadyexists

import com.bortnik.chiron.domain.exceptions.EntityAlreadyExistsException
import java.time.DayOfWeek
import java.util.UUID

class WorkScheduleAlreadyExistsException(criteria: Map<String, Any?>) : EntityAlreadyExistsException(ENTITY_NAME, criteria) {

    constructor(veterinarianId: UUID, dayOfWeek: DayOfWeek) : this(mapOf("veterinarianId" to veterinarianId, "dayOfWeek" to dayOfWeek))

    companion object {
        const val ENTITY_NAME = "WorkSchedule"
    }
}
