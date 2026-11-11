package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.photo.ManagePhotoUseCase
import com.bortnik.chiron.domain.photo.PhotoLinks
import com.bortnik.chiron.presentation.api.http.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.util.UUID

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Profile photos")
class PhotoController(private val photos: ManagePhotoUseCase) {

    @Operation(summary = "Replace a pet photo", description = "JPEG or PNG up to 5 MB and 20 million pixels.")
    @PutMapping(
        value = ["/client/pets/{id}/photo", "/admin/pets/{id}/photo"],
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE]
    )
    fun putPet(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @RequestPart file: MultipartFile,
    ): ApiResponse<PhotoLinks> = file.inputStream.use { ApiResponse.success(photos.replacePet(actor, id, it)) }

    @Operation(summary = "Delete a pet photo")
    @DeleteMapping("/client/pets/{id}/photo", "/admin/pets/{id}/photo")
    fun deletePet(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        photos.deletePet(actor, id)
        return ApiResponse.noContent()
    }

    @Operation(summary = "Replace a veterinarian photo", description = "JPEG or PNG up to 5 MB and 20 million pixels.")
    @PutMapping("/admin/veterinarians/{id}/photo", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun putVeterinarian(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @RequestPart file: MultipartFile,
    ): ApiResponse<PhotoLinks> = file.inputStream.use { ApiResponse.success(photos.replaceVeterinarian(actor, id, it)) }

    @Operation(summary = "Delete a veterinarian photo")
    @DeleteMapping("/admin/veterinarians/{id}/photo")
    fun deleteVeterinarian(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        photos.deleteVeterinarian(actor, id)
        return ApiResponse.noContent()
    }

    @Operation(
        summary = "Replace own veterinarian photo",
        description = "JPEG or PNG up to 5 MB and 20 million pixels."
    )
    @PutMapping("/veterinarian/profile/photo", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun putOwnVeterinarian(
        @AuthenticationPrincipal actor: Actor,
        @RequestPart file: MultipartFile
    ): ApiResponse<PhotoLinks> =
        file.inputStream.use { ApiResponse.success(photos.replaceOwnVeterinarian(actor, it)) }

    @Operation(summary = "Delete own veterinarian photo")
    @DeleteMapping("/veterinarian/profile/photo")
    fun deleteOwnVeterinarian(@AuthenticationPrincipal actor: Actor): ResponseEntity<Nothing> {
        photos.deleteOwnVeterinarian(actor)
        return ApiResponse.noContent()
    }
}
