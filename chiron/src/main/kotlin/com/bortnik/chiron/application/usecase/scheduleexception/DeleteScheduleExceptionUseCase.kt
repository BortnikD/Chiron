package com.bortnik.chiron.application.usecase.scheduleexception

import com.bortnik.chiron.domain.exceptions.notfound.ScheduleExceptionNotFoundException
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class DeleteScheduleExceptionUseCase(private val scheduleExceptionRepository: ScheduleExceptionRepository) {

    fun delete(id: UUID) {
        if (!scheduleExceptionRepository.deleteById(id)) throw ScheduleExceptionNotFoundException(id)
    }
}
