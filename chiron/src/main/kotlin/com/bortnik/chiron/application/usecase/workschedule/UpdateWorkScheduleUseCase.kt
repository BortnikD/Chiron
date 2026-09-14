package com.bortnik.chiron.application.usecase.workschedule

import com.bortnik.chiron.domain.dto.workschedule.UpdateWorkScheduleDto
import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.domain.exceptions.notfound.WorkScheduleNotFoundException
import com.bortnik.chiron.domain.repositories.WorkScheduleRepository
import com.bortnik.chiron.domain.utils.validators.WorkScheduleValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class UpdateWorkScheduleUseCase(private val workScheduleRepository: WorkScheduleRepository) {

    fun update(id: UUID, dto: UpdateWorkScheduleDto): WorkSchedule {
        WorkScheduleValidator.validate(dto)
        return workScheduleRepository.update(id, dto) ?: throw WorkScheduleNotFoundException(id)
    }
}
