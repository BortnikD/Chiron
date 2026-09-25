package com.bortnik.chiron.application.usecase.admin.scheduleexception

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.scheduleexception.GetScheduleExceptionUseCase
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.scheduleexception.ScheduleExceptionFilter
import com.bortnik.chiron.domain.entities.ScheduleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AdminGetScheduleExceptionUseCase(private val getScheduleExceptionUseCase: GetScheduleExceptionUseCase) {

    fun findById(actor: Actor, id: UUID): ScheduleException = getScheduleExceptionUseCase.findById(id)

    fun findAll(actor: Actor, filter: ScheduleExceptionFilter, pageRequest: PageRequest): Page<ScheduleException> =
        getScheduleExceptionUseCase.findAll(filter, pageRequest)
}
