package com.bortnik.chiron.application.usecase.admin.workschedule

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.workschedule.CreateWorkScheduleDto
import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.domain.repositories.WorkScheduleRepository
import com.bortnik.chiron.domain.utils.validators.WorkScheduleValidator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateWorkScheduleUseCase(private val workScheduleRepository: WorkScheduleRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun create(actor: Actor, dto: CreateWorkScheduleDto): WorkSchedule {
        WorkScheduleValidator.validate(dto)
        val schedule = workScheduleRepository.create(dto)
        log.info(
            "Admin {} ({}) created work schedule {} for veterinarian {}: {} {}-{}",
            actor.userId,
            actor.fullName,
            schedule.id,
            schedule.veterinarianId,
            schedule.dayOfWeek,
            schedule.startTime,
            schedule.endTime,
        )
        return schedule
    }
}
