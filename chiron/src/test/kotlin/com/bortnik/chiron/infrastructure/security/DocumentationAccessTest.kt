package com.bortnik.chiron.infrastructure.security

import com.bortnik.chiron.infrastructure.config.CorsProperties
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import org.springframework.mock.web.MockServletContext
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext
import org.springframework.web.servlet.config.annotation.EnableWebMvc
import kotlin.test.assertEquals

class DocumentationAccessTest {
    @Test
    fun `documentation is public only in local and production takes precedence`() {
        for (profiles in listOf(
            emptyArray(),
            arrayOf("local"),
            arrayOf("production"),
            arrayOf("local", "production")
        )) {
            AnnotationConfigWebApplicationContext().use { context ->
                context.environment.setActiveProfiles(*profiles)
                context.servletContext = MockServletContext()
                context.register(
                    SecurityConfig::class.java,
                    TestConfig::class.java,
                    DocumentationController::class.java
                )
                context.refresh()
                val mvc = MockMvcBuilders.webAppContextSetup(context)
                    .apply<org.springframework.test.web.servlet.setup.DefaultMockMvcBuilder>(springSecurity()).build()
                for (path in listOf(
                    "/scalar.html",
                    "/swagger-ui.html",
                    "/swagger-ui/index.html",
                    "/v3/api-docs",
                    "/v3/api-docs.yaml",
                    "/v3/api-docs/swagger-config"
                )) {
                    for (authenticated in listOf(false, true)) {
                        val request = get(path)
                        if (authenticated) request.with(user("admin").roles("ADMIN"))
                        val expected =
                            if (profiles.contentEquals(arrayOf("local"))) 200 else if (authenticated) 403 else 401
                        assertEquals(
                            expected,
                            mvc.perform(request).andReturn().response.status,
                            "${profiles.toList()} $path authenticated=$authenticated"
                        )
                    }
                }
            }
        }
    }

    @Test
    fun `documentation generation is disabled by default and in production`() {
        for (profile in listOf("", "local", "production")) {
            val yaml = YamlPropertiesFactoryBean()
            val resources = mutableListOf(ClassPathResource("application.yaml"))
            if (profile.isNotEmpty()) resources.add(ClassPathResource("application-$profile.yaml"))
            yaml.setResources(*resources.toTypedArray())
            val properties = yaml.getObject()!!
            for (property in listOf("springdoc.api-docs.enabled", "springdoc.swagger-ui.enabled")) {
                assertEquals((profile == "local").toString(), properties.getProperty(property))
            }
        }
    }

    @Configuration
    @EnableWebMvc
    class TestConfig {
        @Bean
        fun jwtActorResolver(): JwtActorResolver = mock(JwtActorResolver::class.java)

        @Bean
        fun corsProperties() = CorsProperties(emptyList())

        @Bean
        fun authenticationEntryPoint() = AuthenticationEntryPoint { _, response, _ -> response.status = 401 }

        @Bean
        fun accessDeniedHandler() = AccessDeniedHandler { _, response, _ -> response.status = 403 }
    }

    @RestController
    class DocumentationController {
        @GetMapping(
            "/scalar.html",
            "/swagger-ui.html",
            "/swagger-ui/index.html",
            "/v3/api-docs",
            "/v3/api-docs.yaml",
            "/v3/api-docs/swagger-config"
        )
        fun documentation() = "documentation"
    }
}
