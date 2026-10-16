package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.scheduleexception.CreateScheduleExceptionDto
import com.bortnik.chiron.domain.dto.scheduleexception.ScheduleExceptionFilter
import com.bortnik.chiron.domain.dto.scheduleexception.UpdateScheduleExceptionDto
import com.bortnik.chiron.domain.entities.ScheduleException
import java.util.UUID

interface ScheduleExceptionRepository {
    fun create(dto: CreateScheduleExceptionDto): ScheduleException

    fun findById(id: UUID): ScheduleException?

    fun findAllByVeterinarianId(veterinarianId: UUID): List<ScheduleException>

    fun findAll(filter: ScheduleExceptionFilter): List<ScheduleException>

    fun findAll(filter: ScheduleExceptionFilter, pageRequest: PageRequest): Page<ScheduleException>

    fun update(id: UUID, dto: UpdateScheduleExceptionDto): ScheduleException?

    fun deleteById(id: UUID): Boolean
}
