package com.bortnik.chiron.application.usecase.admin.scheduleexception

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.exceptions.notfound.ScheduleExceptionNotFoundException
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteScheduleExceptionUseCase(private val scheduleExceptionRepository: ScheduleExceptionRepository) {

    fun delete(actor: Actor, id: UUID) {
        if (!scheduleExceptionRepository.deleteById(id)) throw ScheduleExceptionNotFoundException(id)
    }
}
