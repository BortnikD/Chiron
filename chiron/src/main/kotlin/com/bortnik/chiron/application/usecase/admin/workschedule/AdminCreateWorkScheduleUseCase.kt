package com.bortnik.chiron.application.usecase.admin.workschedule

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.workschedule.CreateWorkScheduleDto
import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.domain.repositories.WorkScheduleRepository
import com.bortnik.chiron.domain.utils.validators.WorkScheduleValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateWorkScheduleUseCase(private val workScheduleRepository: WorkScheduleRepository) {

    fun create(actor: Actor, dto: CreateWorkScheduleDto): WorkSchedule {
        WorkScheduleValidator.validate(dto)
        return workScheduleRepository.create(dto)
    }
}
