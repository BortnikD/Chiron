package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.workschedule.CreateWorkScheduleDto
import com.bortnik.chiron.domain.dto.workschedule.UpdateWorkScheduleDto
import com.bortnik.chiron.domain.entities.WorkSchedule
import java.util.UUID

interface WorkScheduleRepository {
    fun create(dto: CreateWorkScheduleDto): WorkSchedule

    fun findById(id: UUID): WorkSchedule?

    fun findAllByVeterinarianId(veterinarianId: UUID): List<WorkSchedule>

    fun update(id: UUID, dto: UpdateWorkScheduleDto): WorkSchedule?

    fun deleteById(id: UUID): Boolean
}
