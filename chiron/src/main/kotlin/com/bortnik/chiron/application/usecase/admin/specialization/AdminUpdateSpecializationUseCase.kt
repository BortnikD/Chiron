package com.bortnik.chiron.application.usecase.admin.specialization

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.specialization.UpdateSpecializationDto
import com.bortnik.chiron.domain.entities.Specialization
import com.bortnik.chiron.domain.exceptions.notfound.SpecializationNotFoundException
import com.bortnik.chiron.domain.repositories.SpecializationRepository
import com.bortnik.chiron.domain.utils.validators.SpecializationValidator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdateSpecializationUseCase(private val specializationRepository: SpecializationRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, id: UUID, dto: UpdateSpecializationDto): Specialization {
        SpecializationValidator.validate(dto)
        val specialization = specializationRepository.update(id, dto) ?: throw SpecializationNotFoundException(id)
        log.info(
            "Admin {} ({}) updated specialization {} '{}'",
            actor.userId,
            actor.fullName,
            specialization.id,
            specialization.name,
        )
        return specialization
    }
}
