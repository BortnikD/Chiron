package com.bortnik.chiron.application.usecase.admin.scheduleexception

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.scheduleexception.CreateScheduleExceptionDto
import com.bortnik.chiron.domain.dto.scheduleexception.ScheduleExceptionFilter
import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import com.bortnik.chiron.domain.utils.validators.ScheduleExceptionValidator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateScheduleExceptionUseCase(private val scheduleExceptionRepository: ScheduleExceptionRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun create(actor: Actor, dto: CreateScheduleExceptionDto): ScheduleException {
        val exceptions = scheduleExceptionRepository.findAll(
            ScheduleExceptionFilter(veterinarianId = dto.veterinarianId, from = dto.startDate, to = dto.endDate),
        )
        ScheduleExceptionValidator.validate(dto, exceptions)
        val exception = scheduleExceptionRepository.create(dto)
        log.info(
            "Admin {} ({}) created schedule exception {} ({}) for veterinarian {}: {} - {}",
            actor.userId,
            actor.fullName,
            exception.id,
            exception.type,
            exception.veterinarianId,
            exception.startDate,
            exception.endDate,
        )
        return exception
    }
}
