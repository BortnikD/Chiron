package com.bortnik.chiron.application.usecase.scheduleexception

import com.bortnik.chiron.domain.dto.scheduleexception.CreateScheduleExceptionDto
import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import com.bortnik.chiron.domain.utils.validators.ScheduleExceptionValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class CreateScheduleExceptionUseCase(private val scheduleExceptionRepository: ScheduleExceptionRepository) {

    fun create(dto: CreateScheduleExceptionDto): ScheduleException {
        ScheduleExceptionValidator.validate(dto)
        return scheduleExceptionRepository.create(dto)
    }
}
