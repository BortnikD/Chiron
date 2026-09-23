package com.bortnik.chiron.application.usecase.admin.workschedule

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.exceptions.notfound.WorkScheduleNotFoundException
import com.bortnik.chiron.domain.repositories.WorkScheduleRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteWorkScheduleUseCase(private val workScheduleRepository: WorkScheduleRepository) {

    fun delete(actor: Actor, id: UUID) {
        if (!workScheduleRepository.deleteById(id)) throw WorkScheduleNotFoundException(id)
    }
}
