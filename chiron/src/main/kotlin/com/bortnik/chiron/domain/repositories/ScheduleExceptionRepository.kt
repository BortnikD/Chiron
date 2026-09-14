package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.scheduleexception.CreateScheduleExceptionDto
import com.bortnik.chiron.domain.dto.scheduleexception.UpdateScheduleExceptionDto
import com.bortnik.chiron.domain.entities.ScheduleException
import java.util.UUID

interface ScheduleExceptionRepository {
    fun create(dto: CreateScheduleExceptionDto): ScheduleException

    fun findById(id: UUID): ScheduleException?

    fun findAllByVeterinarianId(veterinarianId: UUID): List<ScheduleException>

    fun update(id: UUID, dto: UpdateScheduleExceptionDto): ScheduleException?

    fun deleteById(id: UUID): Boolean
}
