package com.bortnik.chiron.infrastructure.photo

import com.bortnik.chiron.application.config.StorageProperties
import com.bortnik.chiron.application.photo.PhotoStorageException
import com.sun.net.httpserver.HttpServer
import org.junit.jupiter.api.Test
import java.net.InetSocketAddress
import java.net.URI
import java.time.Duration
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class S3PhotoStorageTest {
    @Test
    fun `S3 operations use internal endpoint while signed links use public endpoint`() {
        val objects = mutableMapOf<String, ByteArray>()
        val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
        server.createContext("/") { exchange ->
            when (exchange.requestMethod) {
                "PUT" -> objects[exchange.requestURI.path] = exchange.requestBody.readBytes()
                "DELETE" -> objects.remove(exchange.requestURI.path)
            }
            exchange.sendResponseHeaders(200, -1)
            exchange.close()
        }
        server.start()
        try {
            val props = properties(URI("http://127.0.0.1:${server.address.port}"))
            S3PhotoStorage(props).use { storage ->
                storage.checkAvailability()
                storage.put("pets/id/photos/version/64.jpg", byteArrayOf(1, 2, 3))
                assertContentEquals(byteArrayOf(1, 2, 3), objects["/photos/pets/id/photos/version/64.jpg"])
                val links = storage.links("pets/id/photos/version")
                for ((size, url) in listOf(512 to links.photoUrl, 64 to links.photoThumbnailUrl)) {
                    val uri = URI(url)
                    assertEquals("media.example.test", uri.host)
                    assertEquals("/photos/pets/id/photos/version/$size.jpg", uri.path)
                    assertTrue(uri.query.contains("X-Amz-Expires=900"))
                    assertTrue(uri.query.contains("X-Amz-Signature="))
                    assertFalse(url.contains(props.secretKey))
                }
                storage.delete("pets/id/photos/version/64.jpg")
                storage.delete("pets/id/photos/version/64.jpg")
                assertTrue(objects.isEmpty())
            }
        } finally {
            server.stop(0)
        }
    }

    @Test
    fun `storage failures do not leak SDK details to callers`() {
        val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
        server.createContext("/") { it.sendResponseHeaders(403, -1); it.close() }
        server.start()
        try {
            S3PhotoStorage(properties(URI("http://127.0.0.1:${server.address.port}"))).use { storage ->
                assertFailsWith<PhotoStorageException> { storage.checkAvailability() }
            }
        } finally {
            server.stop(0)
        }
    }

    private fun properties(endpoint: URI) = StorageProperties(
        endpoint,
        URI("https://media.example.test"),
        "garage",
        "photos",
        "test-key",
        "private-test-secret",
        Duration.ofMinutes(15),
    )
}
