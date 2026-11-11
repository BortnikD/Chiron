package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.pet.PetDetailsDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.photo.PhotoStorage
import org.springframework.stereotype.Component

@Component
class PhotoResponseMapper(private val storage: PhotoStorage) {
    fun pet(pet: Pet) = pet.toResponse(pet.photoKey?.let(storage::links))
    fun pet(details: PetDetailsDto) = details.toResponse(details.pet.photoKey?.let(storage::links))
    fun veterinarian(details: VeterinarianDetailsDto) =
        details.toResponse(details.veterinarian.photoKey?.let(storage::links))
}
