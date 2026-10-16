package com.bortnik.chiron.application.usecase.common.scheduleexception

import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.scheduleexception.ScheduleExceptionFilter
import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.domain.exceptions.notfound.ScheduleExceptionNotFoundException
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import com.bortnik.chiron.domain.utils.validators.PageRequestValidator
import com.bortnik.chiron.domain.utils.validators.ScheduleExceptionValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetScheduleExceptionUseCase(private val scheduleExceptionRepository: ScheduleExceptionRepository) {

    fun findById(id: UUID): ScheduleException =
        scheduleExceptionRepository.findById(id) ?: throw ScheduleExceptionNotFoundException(id)

    fun findAll(filter: ScheduleExceptionFilter): List<ScheduleException> {
        ScheduleExceptionValidator.validate(filter)
        return scheduleExceptionRepository.findAll(filter)
    }

    fun findAll(filter: ScheduleExceptionFilter, pageRequest: PageRequest): Page<ScheduleException> {
        ScheduleExceptionValidator.validate(filter)
        PageRequestValidator.validate(pageRequest)
        return scheduleExceptionRepository.findAll(filter, pageRequest)
    }
}
