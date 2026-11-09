package com.bortnik.chiron.application.usecase.admin.veterinarian

import com.bortnik.chiron.application.usecase.common.veterinarian.GetVeterinarianUseCase
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AdminGetVeterinarianUseCase(private val getVeterinarianUseCase: GetVeterinarianUseCase) {

    fun findByUserId(userId: UUID): VeterinarianDetailsDto = getVeterinarianUseCase.findByUserId(userId)

    fun findAll(filter: VeterinarianFilter): List<VeterinarianDetailsDto> = getVeterinarianUseCase.findAll(filter)
}
