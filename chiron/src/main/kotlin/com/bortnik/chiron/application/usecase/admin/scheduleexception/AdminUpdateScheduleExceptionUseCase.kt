package com.bortnik.chiron.application.usecase.admin.scheduleexception

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.scheduleexception.UpdateScheduleExceptionDto
import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.domain.exceptions.notfound.ScheduleExceptionNotFoundException
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import com.bortnik.chiron.domain.utils.validators.ScheduleExceptionValidator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdateScheduleExceptionUseCase(private val scheduleExceptionRepository: ScheduleExceptionRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, id: UUID, dto: UpdateScheduleExceptionDto): ScheduleException {
        ScheduleExceptionValidator.validate(dto)
        val exception = scheduleExceptionRepository.update(id, dto) ?: throw ScheduleExceptionNotFoundException(id)
        log.info(
            "Admin {} ({}) updated schedule exception {} ({}) for veterinarian {}: {} - {}",
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
