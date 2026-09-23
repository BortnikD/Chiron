package com.bortnik.chiron.application.usecase.admin.workschedule

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.workschedule.UpdateWorkScheduleDto
import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.domain.exceptions.notfound.WorkScheduleNotFoundException
import com.bortnik.chiron.domain.repositories.WorkScheduleRepository
import com.bortnik.chiron.domain.utils.validators.WorkScheduleValidator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdateWorkScheduleUseCase(private val workScheduleRepository: WorkScheduleRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, id: UUID, dto: UpdateWorkScheduleDto): WorkSchedule {
        WorkScheduleValidator.validate(dto)
        val schedule = workScheduleRepository.update(id, dto) ?: throw WorkScheduleNotFoundException(id)
        log.info(
            "Admin {} ({}) updated work schedule {} for veterinarian {}: {} {}-{}",
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
