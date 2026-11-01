package com.bortnik.chiron.application.usecase.admin.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.veterinarian.GetVeterinarianUseCase
import com.bortnik.chiron.application.usecase.common.veterinarian.UpdateVeterinarianUseCase
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdateVeterinarianUseCase(
    private val updateVeterinarianUseCase: UpdateVeterinarianUseCase,
    private val getVeterinarianUseCase: GetVeterinarianUseCase,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, id: UUID, dto: UpdateVeterinarianDto): VeterinarianDetailsDto {
        val details = getVeterinarianUseCase.findById(id)
        val veterinarian = updateVeterinarianUseCase.update(id, dto)
        log.info(
            "Admin {} ({}) updated veterinarian {}: specialization {}, active {}",
            actor.userId,
            actor.fullName,
            veterinarian.id,
            veterinarian.specializationId,
            veterinarian.isActive,
        )
        return details.copy(veterinarian = veterinarian)
    }
}
