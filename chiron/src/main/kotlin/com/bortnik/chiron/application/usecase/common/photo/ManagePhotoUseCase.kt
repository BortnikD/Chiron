package com.bortnik.chiron.application.usecase.common.photo

import com.bortnik.chiron.application.photo.PhotoProcessor
import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.photo.PhotoLinks
import com.bortnik.chiron.domain.photo.PhotoOwner
import com.bortnik.chiron.domain.photo.PhotoRepository
import com.bortnik.chiron.domain.photo.PhotoStorage
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import org.springframework.stereotype.Service
import java.io.InputStream
import java.util.UUID

@Service
class ManagePhotoUseCase(
    private val guard: ResourceAccessGuard,
    private val pets: PetRepository,
    private val veterinarians: VeterinarianRepository,
    private val processor: PhotoProcessor,
    private val storage: PhotoStorage,
    private val repository: PhotoRepository,
    private val commit: CommitPhotoUseCase,
) {
    fun replacePet(actor: Actor, id: UUID, input: InputStream): PhotoLinks {
        requirePet(actor, id)
        return replace(PhotoOwner.PET, id, input)
    }

    fun deletePet(actor: Actor, id: UUID) {
        requirePet(actor, id)
        commit.commit(PhotoOwner.PET, id, null)
    }

    fun replaceVeterinarian(actor: Actor, id: UUID, input: InputStream): PhotoLinks {
        requireVeterinarian(actor, id)
        return replace(PhotoOwner.VETERINARIAN, id, input)
    }

    fun deleteVeterinarian(actor: Actor, id: UUID) {
        requireVeterinarian(actor, id)
        commit.commit(PhotoOwner.VETERINARIAN, id, null)
    }

    fun replaceOwnVeterinarian(actor: Actor, input: InputStream): PhotoLinks =
        replaceVeterinarian(actor, guard.requireVeterinarian(actor).id, input)

    fun deleteOwnVeterinarian(actor: Actor) = deleteVeterinarian(actor, guard.requireVeterinarian(actor).id)

    private fun replace(owner: PhotoOwner, id: UUID, input: InputStream): PhotoLinks {
        val variants = processor.process(input)
        val key = "${owner.directory}/$id/photos/${UUID.randomUUID()}"
        // An uncommitted upload stays scheduled for cleanup, including after a process crash.
        repository.stage(key)
        storage.put("$key/64.jpg", variants.thumbnail)
        storage.put("$key/512.jpg", variants.full)
        val links = storage.links(key)
        commit.commit(owner, id, key)
        return links
    }

    private fun requirePet(actor: Actor, id: UUID) {
        if (actor.role == UserRole.ADMIN) {
            pets.findById(id) ?: throw PetNotFoundException(id)
        } else {
            if (actor.role != UserRole.CLIENT) throw AccessDeniedException("Only the owner or an admin may change a pet photo")
            guard.requireOwnedPet(actor, id)
        }
    }

    private fun requireVeterinarian(actor: Actor, id: UUID) {
        val veterinarian = veterinarians.findById(id) ?: throw VeterinarianNotFoundException(id)
        if (actor.role != UserRole.ADMIN && (actor.role != UserRole.VETERINARIAN || veterinarian.userId != actor.userId)) {
            throw AccessDeniedException("Only the veterinarian or an admin may change this photo")
        }
    }
}
