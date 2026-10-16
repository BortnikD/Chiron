package com.bortnik.chiron.application.usecase.admin.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.veterinarian.CreateVeterinarianDto
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.alreadyexists.VeterinarianAlreadyExistsException
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.UserRoleMismatchException
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.utils.validators.VeterinarianValidator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateVeterinarianUseCase(
    private val veterinarianRepository: VeterinarianRepository,
    private val userRepository: UserRepository,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun create(actor: Actor, dto: CreateVeterinarianDto): Veterinarian {
        VeterinarianValidator.validate(dto)
        val user = userRepository.findById(dto.userId) ?: throw UserNotFoundException(dto.userId)
        if (user.role != UserRole.VETERINARIAN) throw UserRoleMismatchException(
            user.id,
            UserRole.VETERINARIAN,
            user.role
        )
        if (veterinarianRepository.findByUserId(dto.userId) != null) {
            throw VeterinarianAlreadyExistsException.byUserId(dto.userId)
        }
        val veterinarian = veterinarianRepository.create(dto)
        log.info(
            "Admin {} ({}) created veterinarian profile {} for user {} ({})",
            actor.userId,
            actor.fullName,
            veterinarian.id,
            user.id,
            user.fullName,
        )
        return veterinarian
    }
}
