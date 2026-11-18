package com.bortnik.chiron.application.usecase.admin.workschedule

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.notification.NotifyScheduleConflictsUseCase
import com.bortnik.chiron.domain.exceptions.notfound.WorkScheduleNotFoundException
import com.bortnik.chiron.domain.repositories.WorkScheduleRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteWorkScheduleUseCase(
    private val workScheduleRepository: WorkScheduleRepository,
    private val notifyScheduleConflicts: NotifyScheduleConflictsUseCase,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, id: UUID) {
        val existing = workScheduleRepository.findById(id) ?: throw WorkScheduleNotFoundException(id)
        val conflictsBefore = notifyScheduleConflicts.conflictingIds(existing.veterinarianId)
        if (!workScheduleRepository.deleteById(id)) throw WorkScheduleNotFoundException(id)
        notifyScheduleConflicts.notifyNewConflicts(actor.userId, existing.veterinarianId, conflictsBefore)
        log.info("Admin {} ({}) deleted work schedule {}", actor.userId, actor.fullName, id)
    }
}
