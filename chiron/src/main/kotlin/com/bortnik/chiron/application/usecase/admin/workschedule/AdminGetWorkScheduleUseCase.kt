package com.bortnik.chiron.application.usecase.admin.workschedule

import com.bortnik.chiron.application.usecase.common.workschedule.GetWorkScheduleUseCase
import com.bortnik.chiron.domain.entities.WorkSchedule
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AdminGetWorkScheduleUseCase(private val getWorkScheduleUseCase: GetWorkScheduleUseCase) {

    fun findById(id: UUID): WorkSchedule = getWorkScheduleUseCase.findById(id)
}
