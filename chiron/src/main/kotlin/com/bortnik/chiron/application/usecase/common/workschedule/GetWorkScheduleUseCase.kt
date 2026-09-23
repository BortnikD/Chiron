package com.bortnik.chiron.application.usecase.common.workschedule

import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.domain.exceptions.notfound.WorkScheduleNotFoundException
import com.bortnik.chiron.domain.repositories.WorkScheduleRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetWorkScheduleUseCase(private val workScheduleRepository: WorkScheduleRepository) {

    fun findById(id: UUID): WorkSchedule =
        workScheduleRepository.findById(id) ?: throw WorkScheduleNotFoundException(id)

    fun findAllByVeterinarianId(veterinarianId: UUID): List<WorkSchedule> =
        workScheduleRepository.findAllByVeterinarianId(veterinarianId)
}
