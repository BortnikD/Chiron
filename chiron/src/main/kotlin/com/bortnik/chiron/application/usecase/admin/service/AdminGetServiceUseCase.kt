package com.bortnik.chiron.application.usecase.admin.service

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.service.GetServiceUseCase
import com.bortnik.chiron.domain.dto.service.ServiceFilter
import com.bortnik.chiron.domain.entities.Service as ServiceEntity
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class AdminGetServiceUseCase(private val getServiceUseCase: GetServiceUseCase) {

    fun findAll(actor: Actor, filter: ServiceFilter): List<ServiceEntity> = getServiceUseCase.findAll(filter)
}
