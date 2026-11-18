package com.bortnik.chiron.application.usecase.admin.scheduleexception

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.notification.NotifyScheduleConflictsUseCase
import com.bortnik.chiron.domain.exceptions.notfound.ScheduleExceptionNotFoundException
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteScheduleExceptionUseCase(
    private val scheduleExceptionRepository: ScheduleExceptionRepository,
    private val notifyScheduleConflicts: NotifyScheduleConflictsUseCase,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, id: UUID) {
        val existing = scheduleExceptionRepository.findById(id) ?: throw ScheduleExceptionNotFoundException(id)
        val conflictsBefore = notifyScheduleConflicts.conflictingIds(existing.veterinarianId)
        if (!scheduleExceptionRepository.deleteById(id)) throw ScheduleExceptionNotFoundException(id)
        notifyScheduleConflicts.notifyNewConflicts(actor.userId, existing.veterinarianId, conflictsBefore)
        log.info("Admin {} ({}) deleted schedule exception {}", actor.userId, actor.fullName, id)
    }
}
