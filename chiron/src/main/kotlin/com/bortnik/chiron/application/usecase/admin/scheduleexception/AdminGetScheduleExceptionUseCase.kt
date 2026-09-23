package com.bortnik.chiron.application.usecase.admin.scheduleexception

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.scheduleexception.GetScheduleExceptionUseCase
import com.bortnik.chiron.domain.entities.ScheduleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AdminGetScheduleExceptionUseCase(private val getScheduleExceptionUseCase: GetScheduleExceptionUseCase) {

    fun findById(actor: Actor, id: UUID): ScheduleException = getScheduleExceptionUseCase.findById(id)
}
