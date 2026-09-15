package com.bortnik.chiron.infrastructure.security.jwt

import com.bortnik.chiron.domain.entities.User
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.Date
import java.util.UUID
import javax.crypto.SecretKey

@Component
class JwtTokenProvider(private val properties: JwtProperties) {

    private val key: SecretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.secret))
    private val parser = Jwts.parser().verifyWith(key).build()

    fun generate(user: User): String {
        val now = Instant.now()
        return Jwts.builder()
            .subject(user.id.toString())
            .claim(ROLE_CLAIM, user.role.name)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(properties.ttl)))
            .signWith(key)
            .compact()
    }

    // Returns null for malformed, tampered or expired tokens.
    fun parseUserId(token: String): UUID? =
        try {
            parser.parseSignedClaims(token).payload.subject?.let(UUID::fromString)
        } catch (e: JwtException) {
            null
        } catch (e: IllegalArgumentException) {
            null
        }

    companion object {
        const val ROLE_CLAIM = "role"
    }
}
