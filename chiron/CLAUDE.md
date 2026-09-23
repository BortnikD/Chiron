# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and
clarifying questions come before implementation rather than after mistakes.

---

# Project rules

## 5. Language

- All code comments, string literals (exception messages, validation messages, log messages, OpenAPI `summary` /
  `description`, test names) and identifiers are written **in English only**.
- This applies to new code only; do not translate existing Russian text (e.g. comments in `V01__init_tables.sql`,
  `README.md`, `docs/api.md`) unless asked.

## 6. Git

- **Never commit, amend, push, stash, reset or create branches without an explicit request** from the user.
- Leave changes in the working tree; the user reviews and commits them.
- If a commit is explicitly requested, follow the existing message style: Conventional Commits prefix with a scope,
  description in Russian, e.g. `feat(chiron): ...`, `docs: ...`, `build: ...`.

## 7. Running things

- **Always ask before running anything**: Gradle tasks (`build`, `test`, `bootRun`), the app, Docker / docker compose,
  IDE run configurations, SQL against a database, scripts. If there is no answer, the answer is **no**.
- Workflow: finish the work first, then ask whether it should be verified by running (build / tests / app).
- Default verification without running: static analysis through IntelliJ IDEA (see section 8) —
  `get_file_problems` on every changed file, plus checking usages / symbol resolution where signatures changed.
- Read-only commands (`git status`, `git diff`, `git log`, file search) do not need permission.

## 8. IntelliJ IDEA MCP tools (`mcp__idea__*`)

The project is open in IntelliJ IDEA and the MCP server is connected (verified: `get_project_modules`,
`search_symbol`, `get_file_problems` respond). Always pass `projectPath: D:\code\univer\Chiron\chiron`.
Tool schemas are deferred: load them with `ToolSearch` (`select:mcp__idea__<name>`) before the first call.

Use IDEA tools when they save tokens or give more accurate results than text-based tools:

| Task | Tool | Why |
|---|---|---|
| Check changed files for compile errors / warnings | `get_file_problems` (`errorsOnly: true` first) | Replaces a Gradle build; no run needed |
| Find a class / function / property by name | `search_symbol` | Semantic, returns exact coordinates, no noisy matches |
| Who calls a function, impact of a signature change | `analyze_calls` | Real call graph instead of grepping a common name like `create` / `findById` |
| Type, declaration or docs of a symbol at a position | `get_symbol_info` | Avoids reading whole files and imports |
| Rename a class / function / property | `rename_refactoring` | Updates all usages and file names safely |
| Format a changed file to project style | `reformat_file` | Matches IDE code style |
| Dependency versions / modules | `get_project_dependencies`, `get_project_modules` | Faster than parsing Gradle files |
| DB schema questions | `list_database_connections`, `introspect_schema` | Only if a connection is configured; read-only |

Prefer the built-in `Read` / `Grep` / `Glob` / `Edit` when they are cheaper:

- plain text or regex search, reading a file you already know, simple edits;
- non-code files (`.md`, `.yaml`, `.sql`, Dockerfile).

Restrictions:

- `build_project`, `execute_run_configuration`, `execute_terminal_command`, `execute_sql_query`, debugger tools
  (`xdebug_*`) count as **running** — section 7 applies: ask first.
- If IDEA tools are unavailable or fail (IDE closed, indexing), fall back to built-in tools and say so; do not run
  Gradle as a substitute without permission.

## 9. Project conventions

### Stack

Kotlin 2.3 (JVM 21), Spring Boot 4.1 (webmvc, security, validation, actuator, flyway), Exposed 1.5 (DSL, not DAO,
`org.jetbrains.exposed.v1.*` packages), PostgreSQL, jjwt, Jackson 3 (`tools.jackson`), springdoc-openapi, JUnit 5 +
`kotlin.test`. Build: Gradle Kotlin DSL. Repository root (`..`) also holds `web-ui` (Next.js), `docs/`,
`docker-compose.local.yaml`, `.env.example`, `README.md`.

### Architecture (clean architecture, package `com.bortnik.chiron`)

Dependencies point inwards: `presentation` → `application` → `domain` ← `infrastructure`. `domain` has no Spring or
Exposed imports.

- `domain/entities` — immutable `data class` entities (`val` only, `id: UUID`, `createdAt` / `updatedAt: Instant`
  where the table has them); enums in `domain/entities/enums`.
- `domain/dto/<entity>` — `Create<Entity>Dto`, `Update<Entity>Dto`. Update is a partial update (PATCH): non-null
  columns are `T? = null` (null = keep), nullable columns are `Patch<T?> = Patch.Unchanged` (`Patch.Value(null)`
  clears). Request DTOs use `JsonNullable<T?>` for nullable columns, mapped with `toPatch()`. Validators check only
  the present fields, or take `existing` when a rule spans several fields. Repositories write only present fields
  and return `findById` for an empty patch (Exposed rejects an UPDATE without columns).
- `domain/repositories` — `<Entity>Repository` interfaces: `create(dto)`, `findById(id): T?`, `findAll...`,
  `update(id, dto): T?` (null = not found), `deleteById(id): Boolean` (false = not found).
- `domain/exceptions` — hierarchy rooted in `DomainException`:
  - `notfound/<Entity>NotFoundException : EntityNotFoundException` (constructors: `criteria` map, `id: UUID`,
    `field, value`; `companion object { const val ENTITY_NAME }`) → 404;
  - `alreadyexists/<Entity>AlreadyExistsException : EntityAlreadyExistsException` → 409;
  - `rules/<Rule>Exception : BusinessRuleViolationException` with the offending ids as `val` properties → 422;
  - `ValidationException` (list of `ValidationError`) → 400; `AccessDeniedException` → 403;
    `UnauthenticatedException` / `InvalidCredentialsException` → 401.
- `domain/utils/validators/<Entity>Validator` — `object` with `fun validate(dto)` overloads built on
  `validateAll { ensure...(field, value, ...) }` (`ValidationErrorCollector`); collects all errors, then throws.
  Messages are lowercase phrases like `"must not be blank"`. Limits live in `ValidationConstants.<Entity>Rules` and
  mirror SQL constraints (keep the `// CHECK (...)` / `// NUMERIC(p, s)` comments in sync).
- `application/usecase/<role>/<entity>/` — one class per operation, annotated `@Service` + `@Transactional`
  (`@Transactional(readOnly = true)` for reads). Constructor injection of repository interfaces and other use cases.
  Roles mirror the controller packages:
  - `common/` — no access scoping: operations behind public or shared endpoints, plus the shared rules that several
    roles reuse (`pet`, `appointment`, `vaccination`, `user`, `auth`). Classes keep plain names
    (`CreateAppointmentUseCase`). These take no `Actor`.
  - `admin/`, `client/`, `veterinarian/` — entry points for the matching controllers. Class names carry the role
    prefix (`AdminCreatePetUseCase`, `ClientBookAppointmentUseCase`, `VeterinarianGetPatientUseCase`) and every
    public method takes `actor: Actor` first. They perform the access check, add the role-specific part of the
    scenario, and delegate the shared rules to `common/`. The outer transaction covers both, so a check and the
    write it guards are atomic.
- Pattern inside a `common/` use case: validate → check referenced entities and business rules (throw domain
  exceptions) → call the repository → convert `null` / `false` into `<Entity>NotFoundException`.
- **Access control lives in `application`, never in `presentation`.** Controllers pass the `Actor` on; they never
  decide who may touch a resource.
- `application/security/Actor` — the current user (`userId`, `role`, `fullName`), built from `User` by `toActor()`.
  Use cases that a request can reach while authenticated take it; `RegisterUserUseCase`, `AuthenticateUserUseCase`
  and the startup initializer have no actor.
- `application/security/ResourceAccessGuard` — ownership checks (`requireOwned...`, `requirePatient...`,
  `requireVeterinarian`) called by `client/` and `veterinarian/` use cases; `admin/` use cases do not use it.
- `application/config` — `@ConfigurationProperties` classes; `application/bootstrap` — startup initializers.
- `infrastructure/persistence`:
  - `models/Exposed<Entity>Table` — `object : UUIDTable("<sql_table>")`; composite-key tables use plain `Table`.
    Enums via `enumerationByName`, money / weight via `decimal(DECIMAL_PRECISION, DECIMAL_SCALE)`, timestamps via
    `timestampWithTimeZone`; shared sizes in `ExposedColumnConstants`.
  - `mappers/Exposed<Entity>Mapper.kt` — top-level `fun ResultRow.to<Entity>()`; value conversions in
    `ExposedValueConverters.kt` (e.g. `toDbDecimal()`).
  - `repositories/Exposed<Entity>Repository` — `@Repository` + `@Transactional`, every method body wrapped in
    `exposedSql { ... }` (maps `SQLException` to typed `PersistenceException`). Use `insertReturning` /
    `updateReturning`, set `updatedAt = CurrentTimestampWithTimeZone` on update, order lists by `createdAt ASC`.
- `infrastructure/security` — JWT filter (puts an `Actor` into the security context and derives the authorities from
  its role), `SecurityConfig` (URL-based role rules, the coarse first line of defence).
- `presentation/api/http`:
  - `controllers/{admin,veterinarian,client,common,auth}/<Role><Entity>Controller` — base paths
    `/api/v1/admin/...`, `/api/v1/veterinarian/...`, `/api/v1/client/...` (role enforced in `SecurityConfig`),
    `common` = shared / public endpoints under `/api/v1/<entities>`. Plural kebab-case resource names
    (`/work-schedules`). Class annotated `@RestController`, `@RequestMapping`, `@Tag(name = "<Role>: <Entities>")`;
    every endpoint has `@Operation(summary = ...)`. Controllers only map and delegate to use cases; no business logic.
  - Responses: `ApiResponse.success(result)`, `ApiResponse.created(result)` (201), `ApiResponse.noContent()` (204).
    Current user via `@AuthenticationPrincipal actor: Actor`, passed straight into the use case.
  - `dto/request/<entity>/` — `Create/Update<Entity>Request`, role-specific variants prefixed with the role
    (`ClientCreatePetRequest`); `dto/response/<Entity>Response`.
  - `mappers/<Entity>Mapper.kt` — top-level extension functions `Entity.toResponse()`, `Request.toDto()`. Mappers
    only move fields around: values that depend on the current user or on business rules (owner, price snapshot,
    cancellation metadata) are filled in by the use case, which is why role-specific requests map to their own
    domain DTO (`CreateOwnPetDto`, `BookAppointmentDto`, `UpdateAppointmentStatusDto`).
  - `exceptions/` — `DomainExceptionHandler` (highest precedence) and `GlobalExceptionHandler`; new domain exception
    types must extend an existing base class so they map to the right HTTP status automatically.

### Adding a new entity / feature — checklist

Migration → domain entity + DTOs → repository interface → validator + `ValidationConstants` rules → not-found /
already-exists / rule exceptions → Exposed table + mapper + repository → `common/` use cases with the shared rules →
role use cases (`admin/`, `client/`, `veterinarian/`) with the access checks → request / response DTOs + presentation
mapper → controllers per role → `SecurityConfig` if a path is public → `docs/api.md` if the API usage changes.

### Database

- Flyway migrations in `src/main/resources/db/migration`, named `V<NN>__<snake_case_description>.sql` (two-digit
  version). **Never edit an existing migration**; add a new one.
- SQL style: snake_case, singular table names (`pet`, `service`) except `users`; `UUID PRIMARY KEY DEFAULT
  gen_random_uuid()`, `TIMESTAMPTZ NOT NULL DEFAULT now()`, enums stored as `TEXT` with `CHECK (... IN (...))`,
  `NUMERIC` for money / weight, indexes named `<table>_<columns>_idx`.

### Kotlin style

- 4-space indent, trailing commas in multiline parameter / argument lists, max line length ~120.
- Expression bodies (`= ...`) for single-expression functions; `?: throw` for not-found handling.
- Constructor injection with `private val`; no field injection, no `lateinit` for dependencies.
- Explicit imports (no wildcards); `java.util.UUID`, `java.time.*` for time types.
- Comments are rare and explain **why** (non-obvious constraints, security reasons, SQL mirrors), not what.
  Single-line `//` comments above the declaration.
- Config values come from `application.yaml` via `@ConfigurationProperties`; secrets via environment variables
  (`${JWT_SECRET}`), documented in `../.env.example`.

### Tests

- `src/test/kotlin`, mirroring the main package structure, class `<ClassName>Test`.
- JUnit 5 `@Test`, assertions from `kotlin.test` (`assertEquals`, `assertIs`, `assertNull`, ...).
- Test names are backtick sentences in English describing behavior: `` fun `expired token is rejected`() ``.
- Plain unit tests without a Spring context where possible; small private factory helpers at the bottom of the class.
