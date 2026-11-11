package com.bortnik.chiron.application.usecase.common.photo

import com.bortnik.chiron.application.photo.PhotoProcessor
import com.bortnik.chiron.application.photo.PhotoStorageException
import com.bortnik.chiron.application.photo.PhotoVariants
import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.entities.enums.Gender
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.photo.PhotoLinks
import com.bortnik.chiron.domain.photo.PhotoOwner
import com.bortnik.chiron.domain.photo.PhotoRepository
import com.bortnik.chiron.domain.photo.PhotoStorage
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.time.Instant
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ManagePhotoUseCaseTest {
    private val owner = Actor(UUID.randomUUID(), UserRole.CLIENT, "Owner")
    private val pets = mock(PetRepository::class.java)
    private val vets = mock(VeterinarianRepository::class.java)
    private val guard = ResourceAccessGuard(
        pets,
        mock(AppointmentRepository::class.java),
        mock(VaccinationRepository::class.java),
        vets
    )
    private val staged = mutableSetOf<String>()
    private val objects = mutableSetOf<String>()
    private var attached: String? = "old"
    private var failUpload = false
    private var failCommit = false
    private val repository = object : PhotoRepository {
        override fun stage(photoKey: String) {
            staged.add(photoKey)
        }

        override fun lockCleanup(photoKey: String) = staged.contains(photoKey)
        override fun setPhoto(owner: PhotoOwner, id: UUID, photoKey: String?): Boolean {
            if (failCommit) error("Database unavailable")
            attached?.let(staged::add)
            attached = photoKey
            return true
        }

        override fun completeCleanup(photoKey: String) {
            staged.remove(photoKey)
        }

        override fun pendingCleanup() = staged.toList()
    }
    private val storage = object : PhotoStorage {
        override fun put(key: String, bytes: ByteArray) {
            if (failUpload && key.endsWith("512.jpg")) throw PhotoStorageException()
            objects.add(key)
        }

        override fun delete(key: String) {
            objects.remove(key)
        }

        override fun links(photoKey: String) = PhotoLinks("$photoKey/512.jpg", "$photoKey/64.jpg", Instant.now())
        override fun checkAvailability() {}
    }
    private val processor = object : PhotoProcessor {
        override fun process(input: InputStream) = PhotoVariants(byteArrayOf(1), byteArrayOf(2))
    }
    private val useCase =
        ManagePhotoUseCase(guard, pets, vets, processor, storage, repository, CommitPhotoUseCase(repository))
    private val pet = Pet(
        UUID.randomUUID(), "Pet", owner.userId, UUID.randomUUID(), gender = Gender.MALE,
        createdAt = Instant.now(), updatedAt = Instant.now()
    )

    init {
        `when`(pets.findById(pet.id)).thenReturn(pet)
    }

    @Test
    fun `owner upload attaches both variants and schedules the old photo for cleanup`() {
        val result = useCase.replacePet(owner, pet.id, ByteArrayInputStream(byteArrayOf()))
        assertEquals(setOf(result.photoUrl, result.photoThumbnailUrl), objects)
        assertEquals(setOf("old"), staged)
        assertEquals(attached + "/512.jpg", result.photoUrl)
    }

    @Test
    fun `partial upload failure keeps the previous photo and leaves the new one queued for cleanup`() {
        failUpload = true
        assertFailsWith<PhotoStorageException> {
            useCase.replacePet(
                owner,
                pet.id,
                ByteArrayInputStream(byteArrayOf())
            )
        }
        assertEquals("old", attached)
        assertEquals(1, staged.size)
        CleanupPhotoUseCase(repository, storage).delete(staged.single())
        assertTrue(objects.isEmpty())
        assertTrue(staged.isEmpty())
    }

    @Test
    fun `database failure keeps the previous photo and schedules uploaded files for cleanup`() {
        failCommit = true
        assertFailsWith<IllegalStateException> {
            useCase.replacePet(
                owner,
                pet.id,
                ByteArrayInputStream(byteArrayOf())
            )
        }
        assertEquals("old", attached)
        assertEquals(2, objects.size)
        assertEquals(1, staged.size)
    }

    @Test
    fun `other clients and veterinarians cannot change a pet photo`() {
        for (actor in listOf(owner.copy(userId = UUID.randomUUID()), owner.copy(role = UserRole.VETERINARIAN))) {
            assertFailsWith<AccessDeniedException> {
                useCase.replacePet(
                    actor,
                    pet.id,
                    ByteArrayInputStream(byteArrayOf())
                )
            }
            assertFailsWith<AccessDeniedException> { useCase.deletePet(actor, pet.id) }
        }
        assertTrue(staged.isEmpty())
        assertTrue(objects.isEmpty())
    }

    @Test
    fun `veterinarian may change only their own photo and admin may change any photo`() {
        val vet = Veterinarian(
            UUID.randomUUID(), owner.userId, UUID.randomUUID(), experienceYears = 3,
            createdAt = Instant.now(), updatedAt = Instant.now()
        )
        `when`(vets.findById(vet.id)).thenReturn(vet)
        assertFailsWith<AccessDeniedException> { useCase.deleteVeterinarian(owner, vet.id) }
        assertFailsWith<AccessDeniedException> {
            useCase.deleteVeterinarian(
                owner.copy(
                    role = UserRole.VETERINARIAN,
                    userId = UUID.randomUUID()
                ), vet.id
            )
        }
        useCase.replaceVeterinarian(
            owner.copy(role = UserRole.VETERINARIAN),
            vet.id,
            ByteArrayInputStream(byteArrayOf())
        )
        useCase.deleteVeterinarian(owner.copy(role = UserRole.ADMIN), vet.id)
        assertEquals(null, attached)
    }

    @Test
    fun `repeated delete is safe and a completed upload cannot later be cleaned up`() {
        val result = useCase.replacePet(owner, pet.id, ByteArrayInputStream(byteArrayOf()))
        val key = result.photoUrl.removeSuffix("/512.jpg")
        CleanupPhotoUseCase(repository, storage).delete(key)
        assertFalse(objects.isEmpty())
        useCase.deletePet(owner, pet.id)
        useCase.deletePet(owner, pet.id)
        assertEquals(null, attached)
        assertTrue(staged.contains(key))
    }
}
