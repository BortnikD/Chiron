package com.bortnik.chiron.infrastructure.photo

import com.bortnik.chiron.application.config.StorageProperties
import com.bortnik.chiron.application.photo.PhotoStorageException
import com.bortnik.chiron.domain.photo.PhotoLinks
import com.bortnik.chiron.domain.photo.PhotoStorage
import org.springframework.stereotype.Component
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation
import software.amazon.awssdk.core.exception.SdkException
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.S3Configuration
import software.amazon.awssdk.services.s3.presigner.S3Presigner
import java.time.Duration
import java.time.Instant

@Component
class S3PhotoStorage(private val properties: StorageProperties) : PhotoStorage, AutoCloseable {

    private val credentials = StaticCredentialsProvider.create(
        AwsBasicCredentials.create(properties.accessKey, properties.secretKey),
    )

    private val configuration =
        S3Configuration.builder().pathStyleAccessEnabled(true).chunkedEncodingEnabled(false).build()

    private val client = S3Client.builder()
        .httpClientBuilder(UrlConnectionHttpClient.builder())
        .endpointOverride(properties.endpoint)
        .region(Region.of(properties.region))
        .credentialsProvider(credentials)
        .serviceConfiguration(configuration)
        .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
        .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
        .overrideConfiguration {
            it.apiCallTimeout(Duration.ofSeconds(30)).apiCallAttemptTimeout(Duration.ofSeconds(10))
        }
        .build()

    private val presigner = S3Presigner.builder()
        .endpointOverride(properties.publicEndpoint)
        .region(Region.of(properties.region))
        .credentialsProvider(credentials)
        .serviceConfiguration(configuration)
        .build()

    override fun put(key: String, bytes: ByteArray): Unit = storageCall {
        client.putObject(
            { it.bucket(properties.bucket).key(key).contentType("image/jpeg").cacheControl("private, max-age=300") },
            RequestBody.fromBytes(bytes),
        )
        Unit
    }

    override fun delete(key: String): Unit = storageCall {
        client.deleteObject { it.bucket(properties.bucket).key(key) }
        Unit
    }

    override fun links(photoKey: String): PhotoLinks {
        val expiresAt = Instant.now().plus(properties.readUrlTtl)
        fun sign(size: Int) = presigner.presignGetObject {
            it.signatureDuration(properties.readUrlTtl)
                .getObjectRequest { request -> request.bucket(properties.bucket).key("$photoKey/$size.jpg") }
        }.url().toString()
        return PhotoLinks(sign(512), sign(64), expiresAt)
    }

    override fun checkAvailability(): Unit = storageCall {
        client.headBucket { it.bucket(properties.bucket) }
        Unit
    }

    override fun close() {
        client.close()
        presigner.close()
    }

    private fun <T> storageCall(action: () -> T): T = try {
        action()
    } catch (ex: SdkException) {
        throw PhotoStorageException()
    }
}
