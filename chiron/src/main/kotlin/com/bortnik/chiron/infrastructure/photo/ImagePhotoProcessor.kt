package com.bortnik.chiron.infrastructure.photo

import com.bortnik.chiron.application.photo.PhotoProcessor
import com.bortnik.chiron.application.photo.PhotoVariants
import com.bortnik.chiron.domain.exceptions.ValidationError
import com.bortnik.chiron.domain.exceptions.ValidationException
import org.springframework.stereotype.Component
import java.awt.Color
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.InputStream
import javax.imageio.ImageIO

@Component
class ImagePhotoProcessor : PhotoProcessor {

    override fun process(input: InputStream): PhotoVariants {
        val bytes = input.readNBytes(MAX_BYTES + 1)
        if (bytes.isEmpty() || bytes.size > MAX_BYTES) invalid("must contain an image of at most 5 MB")
        try {
            ImageIO.createImageInputStream(ByteArrayInputStream(bytes)).use { stream ->
                val readers = ImageIO.getImageReaders(stream)
                if (!readers.hasNext()) invalid("must be a JPEG or PNG image")
                val reader = readers.next()
                try {
                    if (reader.formatName.lowercase() !in setOf("jpeg", "png")) invalid("must be a JPEG or PNG image")
                    reader.input = stream
                    val width = reader.getWidth(0)
                    val height = reader.getHeight(0)
                    if (width <= 0 || height <= 0 || width.toLong() * height > MAX_PIXELS) {
                        invalid("must contain at most 20 million pixels")
                    }
                    val image = reader.read(0) ?: invalid("must contain a decodable image")
                    return PhotoVariants(resize(image, 64), resize(image, 512))
                } finally {
                    reader.dispose()
                }
            }
        } catch (ex: ValidationException) {
            throw ex
        } catch (ex: java.io.IOException) {
            invalid("must contain a complete decodable image")
        } catch (ex: IllegalArgumentException) {
            invalid("must contain a complete decodable image")
        }
    }

    private fun resize(image: BufferedImage, size: Int): ByteArray {
        val side = minOf(image.width, image.height)
        val x = (image.width - side) / 2
        val y = (image.height - side) / 2
        val result = BufferedImage(size, size, BufferedImage.TYPE_INT_RGB)
        val graphics = result.createGraphics()
        try {
            graphics.color = Color.WHITE
            graphics.fillRect(0, 0, size, size)
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC)
            graphics.drawImage(image, 0, 0, size, size, x, y, x + side, y + side, null)
        } finally {
            graphics.dispose()
        }
        return ByteArrayOutputStream().use { output ->
            check(ImageIO.write(result, "jpeg", output)) { "JPEG encoder is unavailable" }
            output.toByteArray()
        }
    }

    private fun invalid(message: String): Nothing = throw ValidationException(listOf(ValidationError("file", message)))

    companion object {
        const val MAX_BYTES = 5 * 1024 * 1024
        const val MAX_PIXELS = 20_000_000L
    }
}
