package com.bortnik.chiron.presentation.api.http.controllers.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.pet.GetPetUseCase
import com.bortnik.chiron.application.usecase.veterinarian.pet.VeterinarianGetPatientUseCase
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.pet.PetFilter
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.photo.PhotoLinks
import com.bortnik.chiron.domain.photo.PhotoStorage
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.infrastructure.config.CorsProperties
import com.bortnik.chiron.infrastructure.security.JwtActorResolver
import com.bortnik.chiron.infrastructure.security.SecurityConfig
import com.bortnik.chiron.presentation.api.http.exceptions.DomainExceptionHandler
import com.bortnik.chiron.presentation.api.http.mappers.PhotoResponseMapper
import com.bortnik.chiron.support.TestEntities.now
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.veterinarian
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpHeaders
import org.springframework.mock.web.MockServletContext
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.setup.DefaultMockMvcBuilder
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext
import org.springframework.web.servlet.config.annotation.EnableWebMvc
import tools.jackson.databind.json.JsonMapper
import java.util.UUID
import kotlin.test.assertEquals

class VeterinarianPetControllerTest {
    private val context = AnnotationConfigWebApplicationContext().apply {
        servletContext = MockServletContext()
        register(
            SecurityConfig::class.java,
            TestConfig::class.java,
            VeterinarianPetController::class.java,
            VeterinarianGetPatientUseCase::class.java,
            GetPetUseCase::class.java,
            ResourceAccessGuard::class.java,
            PhotoResponseMapper::class.java,
            DomainExceptionHandler::class.java,
        )
        refresh()
    }
    private val mvc = MockMvcBuilders.webAppContextSetup(context)
        .apply<DefaultMockMvcBuilder>(springSecurity()).build()
    private val pets = context.getBean(PetRepository::class.java)
    private val veterinarians = context.getBean(VeterinarianRepository::class.java)
    private val appointments = context.getBean(AppointmentRepository::class.java)
    private val photos = context.getBean(PhotoStorage::class.java)
    private val actor = Actor(veterinarian.userId, UserRole.VETERINARIAN, "Veterinarian")
    private val json = JsonMapper.builder().build()

    init {
        `when`(context.getBean(JwtActorResolver::class.java).resolve("Bearer vet")).thenReturn(actor)
        `when`(veterinarians.findByUserId(actor.userId)).thenReturn(veterinarian)
    }

    @AfterEach
    fun closeContext() = context.close()

    @Test
    fun `list scopes filters by profile id and returns one page with photos and full count`() {
        val filter = PetFilter(
            ownerId = pet.ownerId,
            speciesId = pet.speciesId,
            gender = pet.gender,
            isArchived = false,
            name = "Pet",
            patientOfVeterinarianId = veterinarian.id,
        )
        val page = PageRequest(2, 1)
        val photo = PhotoLinks("https://example.com/full.jpg", "https://example.com/thumb.jpg", now.plusSeconds(3600))
        `when`(pets.findAll(filter, page)).thenReturn(Page(listOf(pet.copy(photoKey = "pets/photo")), 2, 1, 12))
        `when`(photos.links("pets/photo")).thenReturn(photo)

        val response = mvc.perform(
            get("/api/v1/veterinarian/pets")
                .header(HttpHeaders.AUTHORIZATION, "Bearer vet")
                .param("ownerId", pet.ownerId.toString())
                .param("speciesId", pet.speciesId.toString())
                .param("gender", pet.gender.name)
                .param("isArchived", "false")
                .param("name", "  Pet  ")
                .param("page", "2")
                .param("size", "1")
                .param("patientOfVeterinarianId", UUID.randomUUID().toString()),
        ).andReturn().response

        assertEquals(200, response.status)
        val body = json.readTree(response.contentAsString)
        assertEquals(true, body["success"].asBoolean())
        val result = body["result"]
        assertEquals(2, result["page"].asInt())
        assertEquals(1, result["size"].asInt())
        assertEquals(12L, result["totalElements"].asLong())
        assertEquals(12L, result["totalPages"].asLong())
        assertEquals(1, result["items"].size())
        assertEquals(pet.id.toString(), result["items"][0]["id"].asString())
        assertEquals(photo.photoUrl, result["items"][0]["photoUrl"].asString())
        assertEquals(photo.photoThumbnailUrl, result["items"][0]["photoThumbnailUrl"].asString())
        verify(veterinarians).findByUserId(actor.userId)
        verify(pets).findAll(filter, page)
        verifyNoMoreInteractions(pets, veterinarians)
        verifyNoInteractions(appointments)
    }

    @Test
    fun `empty list uses default pagination without loading individual pets or appointments`() {
        val filter = PetFilter(patientOfVeterinarianId = veterinarian.id)
        `when`(pets.findAll(filter, PageRequest(0, 20))).thenReturn(Page(emptyList(), 0, 20, 0))

        val response = mvc.perform(
            get("/api/v1/veterinarian/pets").header(HttpHeaders.AUTHORIZATION, "Bearer vet"),
        ).andReturn().response

        assertEquals(200, response.status)
        val result = json.readTree(response.contentAsString)["result"]
        assertEquals(0, result["items"].size())
        assertEquals(0, result["page"].asInt())
        assertEquals(20, result["size"].asInt())
        assertEquals(0L, result["totalElements"].asLong())
        assertEquals(0L, result["totalPages"].asLong())
        verify(pets).findAll(filter, PageRequest(0, 20))
        verifyNoMoreInteractions(pets)
        verifyNoInteractions(appointments, photos)
    }

    @Test
    fun `invalid pagination and filters are rejected before pet loading`() {
        for ((name, value) in listOf("page" to "-1", "size" to "0", "size" to "101", "name" to "x".repeat(101))) {
            val response = mvc.perform(
                get("/api/v1/veterinarian/pets").header(HttpHeaders.AUTHORIZATION, "Bearer vet").param(name, value),
            ).andReturn().response
            assertEquals(400, response.status, "$name=$value")
        }
        verifyNoInteractions(pets, appointments, photos)
    }

    @Test
    fun `missing veterinarian profile is rejected before patient loading`() {
        `when`(veterinarians.findByUserId(actor.userId)).thenReturn(null)
        val response = mvc.perform(
            get("/api/v1/veterinarian/pets").header(HttpHeaders.AUTHORIZATION, "Bearer vet"),
        ).andReturn().response
        assertEquals(404, response.status)
        verifyNoInteractions(pets, appointments, photos)
    }

    @Test
    fun `anonymous clients and administrators cannot list veterinarian patients`() {
        assertEquals(401, mvc.perform(get("/api/v1/veterinarian/pets")).andReturn().response.status)
        for (role in listOf(UserRole.CLIENT, UserRole.ADMIN)) {
            `when`(context.getBean(JwtActorResolver::class.java).resolve("Bearer other"))
                .thenReturn(actor.copy(role = role))
            val response = mvc.perform(
                get("/api/v1/veterinarian/pets").header(HttpHeaders.AUTHORIZATION, "Bearer other"),
            ).andReturn().response
            assertEquals(403, response.status)
        }
        verifyNoInteractions(pets, veterinarians, appointments, photos)
    }

    @Configuration
    @EnableWebMvc
    class TestConfig {
        @Bean
        fun pets(): PetRepository = mock(PetRepository::class.java)

        @Bean
        fun veterinarians(): VeterinarianRepository = mock(VeterinarianRepository::class.java)

        @Bean
        fun appointments(): AppointmentRepository = mock(AppointmentRepository::class.java)

        @Bean
        fun vaccinations(): VaccinationRepository = mock(VaccinationRepository::class.java)

        @Bean
        fun photos(): PhotoStorage = mock(PhotoStorage::class.java)

        @Bean
        fun jwtActorResolver(): JwtActorResolver = mock(JwtActorResolver::class.java)

        @Bean
        fun corsProperties() = CorsProperties(emptyList())

        @Bean
        fun authenticationEntryPoint() = AuthenticationEntryPoint { _, response, _ -> response.status = 401 }

        @Bean
        fun accessDeniedHandler() = AccessDeniedHandler { _, response, _ -> response.status = 403 }
    }
}
