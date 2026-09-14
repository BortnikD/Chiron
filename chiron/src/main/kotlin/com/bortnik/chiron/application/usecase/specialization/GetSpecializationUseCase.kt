package com.bortnik.chiron.application.usecase.specialization

import com.bortnik.chiron.domain.entities.Specialization
import com.bortnik.chiron.domain.exceptions.notfound.SpecializationNotFoundException
import com.bortnik.chiron.domain.repositories.SpecializationRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetSpecializationUseCase(private val specializationRepository: SpecializationRepository) {

    fun findById(id: UUID): Specialization =
        specializationRepository.findById(id) ?: throw SpecializationNotFoundException(id)

    fun findAll(): List<Specialization> = specializationRepository.findAll()
}
