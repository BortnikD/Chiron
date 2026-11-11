package com.bortnik.chiron.domain.photo

interface PhotoStorage {
    fun put(key: String, bytes: ByteArray)
    fun delete(key: String)
    fun links(photoKey: String): PhotoLinks
    fun checkAvailability()
}
