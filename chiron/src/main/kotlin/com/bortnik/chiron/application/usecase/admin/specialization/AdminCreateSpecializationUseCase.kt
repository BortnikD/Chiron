package com.bortnik.chiron.application.usecase.admin.specialization

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.specialization.CreateSpecializationDto
import com.bortnik.chiron.domain.entities.Specialization
import com.bortnik.chiron.domain.repositories.SpecializationRepository
import com.bortnik.chiron.domain.utils.validators.SpecializationValidator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateSpecializationUseCase(private val specializationRepository: SpecializationRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun create(actor: Actor, dto: CreateSpecializationDto): Specialization {
        SpecializationValidator.validate(dto)
        val specialization = specializationRepository.create(dto)
        log.info(
            "Admin {} ({}) created specialization {} '{}'",
            actor.userId,
            actor.fullName,
            specialization.id,
            specialization.name,
        )
        return specialization
    }
}
