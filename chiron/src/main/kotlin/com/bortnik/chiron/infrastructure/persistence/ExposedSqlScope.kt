package com.bortnik.chiron.infrastructure.persistence

import com.bortnik.chiron.infrastructure.persistence.exceptions.toPersistenceException
import java.sql.SQLException

// Converts any SQLException thrown by Exposed into a typed PersistenceException.
// The transaction itself comes from @Transactional on the repository.
inline fun <T> exposedSql(statement: () -> T): T =
    try {
        statement()
    } catch (e: SQLException) {
        throw e.toPersistenceException()
    }
