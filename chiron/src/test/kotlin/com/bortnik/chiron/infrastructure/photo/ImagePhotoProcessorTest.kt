package com.bortnik.chiron.infrastructure.photo

import com.bortnik.chiron.domain.exceptions.ValidationException
import org.junit.jupiter.api.Test
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class ImagePhotoProcessorTest {
    private val processor = ImagePhotoProcessor()

    @Test
    fun `both variants have the agreed dimensions and the same centered crop`() {
        val original = BufferedImage(800, 400, BufferedImage.TYPE_INT_RGB)
        val g = original.createGraphics()
        g.color = Color.RED
        g.fillRect(0, 0, 800, 400)
        g.color = Color.BLUE
        g.fillRect(200, 0, 400, 400)
        g.dispose()
        val variants = processor.process(ByteArrayInputStream(png(original)))
        for ((size, bytes) in listOf(64 to variants.thumbnail, 512 to variants.full)) {
            val image = ImageIO.read(ByteArrayInputStream(bytes))
            assertEquals(size, image.width)
            assertEquals(size, image.height)
            val center = Color(image.getRGB(size / 2, size / 2))
            assertTrue(center.blue > 240 && center.red < 10)
        }
    }

    @Test
    fun `transparent pixels become white instead of black`() {
        val result = processor.process(ByteArrayInputStream(png(BufferedImage(100, 100, BufferedImage.TYPE_INT_ARGB))))
        val image = ImageIO.read(ByteArrayInputStream(result.thumbnail))
        assertEquals(Color.WHITE.rgb, image.getRGB(32, 32))
    }

    @Test
    fun `empty corrupt SVG and oversized files are rejected`() {
        for (bytes in listOf(
            byteArrayOf(),
            "not an image".toByteArray(),
            "<svg/>".toByteArray(),
            ByteArray(ImagePhotoProcessor.MAX_BYTES + 1)
        )) {
            assertFailsWith<ValidationException> { processor.process(ByteArrayInputStream(bytes)) }
        }
    }

    @Test
    fun `image dimensions are checked before decoding all pixels`() {
        val input = java.nio.file.Files.readAllBytes(java.nio.file.Path.of("scripts/fixtures/photo-a.png"))
        // PNG dimensions are in IHDR; update its CRC so the reader must enforce our pixel limit.
        java.nio.ByteBuffer.wrap(input, 16, 8).putInt(100_000).putInt(100_000)
        val crc = java.util.zip.CRC32().apply { update(input, 12, 17) }
        java.nio.ByteBuffer.wrap(input, 29, 4).putInt(crc.value.toInt())
        assertFailsWith<ValidationException> { processor.process(ByteArrayInputStream(input)) }
    }

    private fun png(image: BufferedImage) = ByteArrayOutputStream().use {
        ImageIO.write(image, "png", it)
        it.toByteArray()
    }
}
