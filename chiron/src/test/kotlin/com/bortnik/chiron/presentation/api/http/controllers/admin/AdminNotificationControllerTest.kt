package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.notification.AdminSendMessageUseCase
import com.bortnik.chiron.domain.dto.notification.SendAdminMessageDto
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.BusinessRuleViolationException
import com.bortnik.chiron.domain.exceptions.ValidationError
import com.bortnik.chiron.infrastructure.config.CorsProperties
import com.bortnik.chiron.infrastructure.security.JwtActorResolver
import com.bortnik.chiron.infrastructure.security.SecurityConfig
import com.bortnik.chiron.presentation.api.http.exceptions.DomainExceptionHandler
import com.bortnik.chiron.presentation.api.http.exceptions.GlobalExceptionHandler
import com.bortnik.chiron.presentation.api.http.exceptions.RestSecurityErrorHandler
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.notification
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.user
import com.bortnik.chiron.support.TestEntities.vaccination
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.mock.web.MockServletContext
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.setup.DefaultMockMvcBuilder
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext
import org.springframework.web.servlet.config.annotation.EnableWebMvc
import tools.jackson.databind.json.JsonMapper
import java.sql.SQLException
import kotlin.test.assertEquals

class AdminNotificationControllerTest {
    private val context = AnnotationConfigWebApplicationContext().apply {
        servletContext = MockServletContext()
        register(
            SecurityConfig::class.java, TestConfig::class.java, AdminNotificationController::class.java,
            DomainExceptionHandler::class.java, GlobalExceptionHandler::class.java,
        )
        refresh()
    }
    private val mvc = MockMvcBuilders.webAppContextSetup(context).apply<DefaultMockMvcBuilder>(springSecurity()).build()
    private val useCase = context.getBean(AdminSendMessageUseCase::class.java)
    private val resolver = context.getBean(JwtActorResolver::class.java)
    private val admin = Actor(user.id, UserRole.ADMIN, "Admin")
    private val json = JsonMapper.builder().build()
    private val path = "/api/v1/admin/notifications"
    private val body = """{"title":"Title","body":"Body"}"""

    init {
        `when`(resolver.resolve("Bearer admin")).thenReturn(admin)
    }

    @AfterEach
    fun closeContext() = context.close()

    @Test
    fun `single user endpoint maps optional event ids and returns created notification`() {
        val dto = SendAdminMessageDto("Title", "Body", appointment.id, pet.id, vaccination.id)
        val saved = notification.copy(
            actorId = admin.userId,
            type = NotificationType.ADMIN_MESSAGE,
            title = dto.title,
            body = dto.body,
            vaccinationId = vaccination.id,
        )
        `when`(useCase.send(admin, pet.ownerId, dto)).thenReturn(saved)
        val linked = """{"title":"Title","body":"Body","appointmentId":"${appointment.id}",
            "petId":"${pet.id}","vaccinationId":"${vaccination.id}"}"""

        val response = mvc.perform(
            post("$path/users/${pet.ownerId}").header(HttpHeaders.AUTHORIZATION, "Bearer admin")
                .contentType(MediaType.APPLICATION_JSON).content(linked),
        ).andReturn().response

        assertEquals(201, response.status)
        val result = json.readTree(response.contentAsString)["result"]
        assertEquals(saved.id.toString(), result["id"].asString())
        assertEquals(saved.type.name, result["type"].asString())
        assertEquals(saved.title, result["title"].asString())
        assertEquals(saved.body, result["body"].asString())
        assertEquals(admin.userId.toString(), result["actorId"].asString())
        assertEquals(appointment.id.toString(), result["appointmentId"].asString())
        assertEquals(pet.id.toString(), result["petId"].asString())
        assertEquals(vaccination.id.toString(), result["vaccinationId"].asString())
        assertEquals(true, result["readAt"].isNull)
        assertEquals(saved.createdAt.toString(), result["createdAt"].asString())
        verify(useCase).send(admin, pet.ownerId, dto)
    }

    @Test
    fun `sending requires a recipient and no broadcast endpoint exists`() {
        for (endpoint in listOf(path, "$path/users", "$path/broadcast")) {
            val response = mvc.perform(
                post(endpoint).header(HttpHeaders.AUTHORIZATION, "Bearer admin")
                    .contentType(MediaType.APPLICATION_JSON).content(body),
            ).andReturn().response
            assertEquals(404, response.status, endpoint)
        }
        verifyNoInteractions(useCase)
    }

    @Test
    fun `anonymous clients and veterinarians cannot send any admin messages`() {
        val endpoint = "$path/users/${pet.ownerId}"
        val anonymous = mvc.perform(
            post(endpoint).contentType(MediaType.APPLICATION_JSON).content(body),
        ).andReturn().response
        assertEquals(401, anonymous.status)
        assertEquals("Bearer", anonymous.getHeader(HttpHeaders.WWW_AUTHENTICATE))
        for (role in listOf(UserRole.CLIENT, UserRole.VETERINARIAN)) {
            `when`(resolver.resolve("Bearer other")).thenReturn(admin.copy(role = role))
            assertEquals(
                403,
                mvc.perform(
                    post(endpoint).header(HttpHeaders.AUTHORIZATION, "Bearer other")
                        .contentType(MediaType.APPLICATION_JSON).content(body),
                ).andReturn().response.status,
            )
        }
        verifyNoInteractions(useCase)
    }

    @Test
    fun `unsupported method keeps Allow and a JWT database outage returns a JSON 503`() {
        val endpoint = "$path/users/${pet.ownerId}"
        val wrongMethod = mvc.perform(
            get(endpoint).header(HttpHeaders.AUTHORIZATION, "Bearer admin"),
        ).andReturn().response
        assertEquals(405, wrongMethod.status)
        assertEquals("POST", wrongMethod.getHeader(HttpHeaders.ALLOW))

        val connectionFailure = SQLException("Connection refused", "08001")
        `when`(resolver.resolve("Bearer admin")).thenThrow(IllegalStateException(connectionFailure))
        val unavailable = mvc.perform(
            post(endpoint).header(HttpHeaders.AUTHORIZATION, "Bearer admin")
                .contentType(MediaType.APPLICATION_JSON).content(body),
        ).andReturn().response
        assertEquals(503, unavailable.status)
        assertEquals("ConnectionException", json.readTree(unavailable.contentAsString)["error"]["name"].asString())
        verifyNoInteractions(useCase)
    }

    @Test
    fun `incompatible linked resources return 422 with a field violation`() {
        `when`(useCase.send(admin, pet.ownerId, SendAdminMessageDto("Title", "Body"))).thenThrow(
            BusinessRuleViolationException(listOf(ValidationError("petId", "must refer to the same pet"))),
        )
        val response = mvc.perform(
            post("$path/users/${pet.ownerId}").header(HttpHeaders.AUTHORIZATION, "Bearer admin")
                .contentType(MediaType.APPLICATION_JSON).content(body),
        ).andReturn().response
        assertEquals(422, response.status)
        val error = json.readTree(response.contentAsString)["error"]
        assertEquals("petId", error["violations"][0]["field"].asString())
    }

    @Test
    fun `invalid text and event ids are rejected before sending`() {
        val invalidBodies = listOf(
            """{"title":" ","body":"Body"}""",
            """{"title":"Title","body":""}""",
            """{"title":"${"x".repeat(201)}","body":"Body"}""",
            """{"title":"Title","body":"${"x".repeat(4001)}"}""",
            """{"title":"Title"}""",
            """{"title":null,"body":"Body"}""",
            """{"title":"Title","body":"Body","appointmentId":"invalid"}""",
        )
        for (invalid in invalidBodies) {
            assertEquals(
                400,
                mvc.perform(
                    post("$path/users/${pet.ownerId}").header(HttpHeaders.AUTHORIZATION, "Bearer admin")
                        .contentType(MediaType.APPLICATION_JSON).content(invalid),
                ).andReturn().response.status,
            )
        }
        assertEquals(
            400, mvc.perform(
                post("$path/users/invalid").header(HttpHeaders.AUTHORIZATION, "Bearer admin")
                    .contentType(MediaType.APPLICATION_JSON).content(body),
            ).andReturn().response.status
        )
        verifyNoInteractions(useCase)
    }

    @Configuration
    @EnableWebMvc
    class TestConfig {
        @Bean
        fun useCase(): AdminSendMessageUseCase = mock(AdminSendMessageUseCase::class.java)

        @Bean
        fun jwtActorResolver(): JwtActorResolver = mock(JwtActorResolver::class.java)

        @Bean
        fun corsProperties() = CorsProperties(emptyList())

        @Bean
        fun securityErrorHandler() = RestSecurityErrorHandler(JsonMapper.builder().build())
    }
}
