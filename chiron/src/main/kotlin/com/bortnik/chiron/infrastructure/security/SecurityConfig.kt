package com.bortnik.chiron.infrastructure.security

import com.bortnik.chiron.application.usecase.user.GetUserUseCase
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.infrastructure.config.CorsProperties
import com.bortnik.chiron.infrastructure.security.jwt.JwtTokenProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
class SecurityConfig {

    // Error handlers are injected by interface: they render ApiResponse and belong to the presentation layer.
    @Bean
    fun securityFilterChain(
        http: HttpSecurity,
        jwtTokenProvider: JwtTokenProvider,
        getUserUseCase: GetUserUseCase,
        authenticationEntryPoint: AuthenticationEntryPoint,
        accessDeniedHandler: AccessDeniedHandler,
    ): SecurityFilterChain = http
        .cors { }
        .csrf { it.disable() }
        .httpBasic { it.disable() }
        .formLogin { it.disable() }
        .logout { it.disable() }
        .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
        .exceptionHandling {
            it.authenticationEntryPoint(authenticationEntryPoint)
            it.accessDeniedHandler(accessDeniedHandler)
        }
        .authorizeHttpRequests {
            it.requestMatchers(*DOCUMENTATION_ENDPOINTS, "/error").permitAll()
            it.requestMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login").permitAll()
            it.requestMatchers(HttpMethod.GET, *PUBLIC_READ_ENDPOINTS).permitAll()
            it.requestMatchers("/api/v1/admin/**").hasRole(UserRole.ADMIN.name)
            it.requestMatchers("/api/v1/veterinarian/**").hasRole(UserRole.VETERINARIAN.name)
            it.requestMatchers("/api/v1/client/**").hasRole(UserRole.CLIENT.name)
            it.anyRequest().authenticated()
        }
        .addFilterBefore(
            JwtAuthenticationFilter(jwtTokenProvider, getUserUseCase),
            UsernamePasswordAuthenticationFilter::class.java,
        )
        .build()

    // Picked up by .cors {}; preflight requests are answered before authentication runs.
    @Bean
    fun corsConfigurationSource(corsProperties: CorsProperties): CorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            allowedOrigins = corsProperties.allowedOrigins
            allowedMethods = listOf("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            allowedHeaders = listOf(HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE)
        }
        return UrlBasedCorsConfigurationSource().apply { registerCorsConfiguration("/**", configuration) }
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    private companion object {
        val DOCUMENTATION_ENDPOINTS = arrayOf("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/scalar.html")

        // Clinic catalog and veterinarian availability, browsable before signing in.
        val PUBLIC_READ_ENDPOINTS = arrayOf(
            "/api/v1/species/**",
            "/api/v1/specializations/**",
            "/api/v1/services/**",
            "/api/v1/veterinarians/**",
            "/api/v1/work-schedules",
            "/api/v1/schedule-exceptions",
            "/api/v1/appointments/availability",
        )
    }
}
