package com.bortnik.chiron.domain.dto.service

import com.bortnik.chiron.domain.entities.Service

data class ServiceDetailsDto(
    val service: Service,
    val effectivePrice: Double? = null,
    val effectiveDurationMin: Int? = null,
)
