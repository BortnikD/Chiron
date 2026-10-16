package com.bortnik.chiron.application.usecase.admin.scheduleexception

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.exceptions.notfound.ScheduleExceptionNotFoundException
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteScheduleExceptionUseCase(private val scheduleExceptionRepository: ScheduleExceptionRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, id: UUID) {
        if (!scheduleExceptionRepository.deleteById(id)) throw ScheduleExceptionNotFoundException(id)
        log.info("Admin {} ({}) deleted schedule exception {}", actor.userId, actor.fullName, id)
    }
}
