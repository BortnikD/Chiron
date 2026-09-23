package com.bortnik.chiron.application.usecase.common.scheduleexception

import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.domain.exceptions.notfound.ScheduleExceptionNotFoundException
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetScheduleExceptionUseCase(private val scheduleExceptionRepository: ScheduleExceptionRepository) {

    fun findById(id: UUID): ScheduleException =
        scheduleExceptionRepository.findById(id) ?: throw ScheduleExceptionNotFoundException(id)

    fun findAllByVeterinarianId(veterinarianId: UUID): List<ScheduleException> =
        scheduleExceptionRepository.findAllByVeterinarianId(veterinarianId)
}
