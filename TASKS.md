# SmartLease — Task Breakdown

> **Development Tasks** — Each task is designed to be completable within 2–3 hours  
> *Total: 42 tasks across 8 phases*

---

## Phase 0: Project Foundation (6 tasks)

### T-001: Maven Project Scaffold

| Field | Value |
|---|---|
| **ID** | T-001 |
| **Description** | Create the Maven project structure with `pom.xml`, directory layout, and build configuration. Set up Spring Boot parent, Java 17 compiler, and all dependency versions (Spring Boot 3.2.x, Spring Security, JPA, MongoDB, Thymeleaf, Lombok, MapStruct, jjwt, Flyway, Testcontainers, SpringDoc, JUnit 5, Mockito, ArchUnit, JaCoCo, SpotBugs). Create all empty package directories per the project layout. |
| **Priority** | **P0** — Blocking |
| **Estimated Time** | 2 hours |
| **Dependencies** | None |
| **Definition of Done** | `mvn clean compile` succeeds. All dependency versions resolve. SpotBugs and Spotless plugins configured. Directory structure matches `PROJECT_CONTEXT.md`. Jacoco plugin configured with coverage targets (domain ≥95%, app ≥90%, infra/presentation ≥80%). |

---

### T-002: Application Entry Point & Common Config

| Field | Value |
|---|---|
| **ID** | T-002 |
| **Description** | Create `SmartLeaseApplication.java` entry point with `SpringApplicationBuilder`. Add all common configuration classes: `JacksonConfig` (date formats, null serialization), `MessageSourceConfig` (i18n), `CorsConfig` (environment-aware origins), `MdcFilter` (trace ID, user ID, request path in MDC), `GlobalExceptionHandler` (404, 400, 401, 403, 409, 422, 429, 500). Create `ApiResponse<T>` envelope class with builder pattern. Create `ApiError` and `FieldError` DTOs. |
| **Priority** | **P0** — Blocking |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-001 |
| **Definition of Done** | Application starts on port 8080. GET `/api/v1/health/liveness` returns `200`. All common configurations load. Global exception handler returns consistent JSON envelope for mock exceptions. MDC population verified in logs. |

---

### T-003: Shared Domain Value Objects & Base Types

| Field | Value |
|---|---|
| **ID** | T-003 |
| **Description** | Create shared value objects in `com.smartlease.common.model`: `Money` (BigDecimal with currency), `Address` (line1, line2, city, state, zip, country), `DateRange` (start, end with validation). Create base exception classes: `SmartLeaseException`, `ResourceNotFoundException`, `BusinessRuleViolationException`. Create utility classes: `DateUtils`, `ValidationUtils`. Create custom annotations: `@AuthenticatedUser`, `@RateLimited`. |
| **Priority** | **P0** — Blocking |
| **Estimated Time** | 2 hours |
| **Dependencies** | T-002 |
| **Definition of Done** | All value objects are immutable (`@Value` or `record`). `DateRange` rejects end < start. `Money` rejects negative amounts. Exception hierarchy matches documented tree. Unit tests for `DateRange` and `Money` pass with ≥95% coverage. |

---

### T-004: Security Framework — JWT & Spring Security Config

| Field | Value |
|---|---|
| **ID** | T-004 |
| **Description** | Implement the security framework in `com.smartlease.security`. Create `JwtTokenProvider` (generate access token with userId/role claims, validate, parse, blacklist check). Create `JwtAuthenticationFilter` (extract Bearer token, validate, set SecurityContext). Create `UserPrincipal` (implements `UserDetails`). Create `JwtAuthenticationEntryPoint` (401 JSON response). Create `SecurityConfig` (permit auth endpoints, CSRF disabled for API, sessionless, CORS, rate limiting on login). Create `MethodSecurityConfig` (`@EnableMethodSecurity`). Create `@CurrentUser` annotation with HandlerMethodArgumentResolver. |
| **Priority** | **P0** — Blocking |
| **Estimated Time** | 3 hours |
| **Dependencies** | T-002, T-003 |
| **Definition of Done** | JWT token generation and validation unit tested. Filter chain correctly configured. Unauthenticated requests to protected endpoints return 401. Authenticated requests reach controllers. `@CurrentUser` resolvers works. Rate limiting on `/auth/login` functional. |

---

### T-005: Flyway Migrations — V1 Schema & V2 Seed Data

| Field | Value |
|---|---|
| **ID** | T-005 |
| **Description** | Create `V1__init_schema.sql`: all 24 PostgreSQL tables with columns, constraints, domains, primary keys, foreign keys, and indexes as defined in `DATABASE.md`. Create `V2__seed_roles.sql`: insert 5 roles (ADMIN, PROPERTY_MANAGER, TENANT, VENDOR, VIEWER). Insert default `late_fee_rules` (5-day grace, 5% fee, $75 cap). Insert 4 `sla_policies` (LOW 120h, MEDIUM 72h, HIGH 24h, URGENT 4h). Create `V3__create_views.sql`: `vw_dashboard_occupancy`, `vw_dashboard_financial_summary`, `vw_dashboard_maintenance_summary`. |
| **Priority** | **P0** — Blocking |
| **Estimated Time** | 3 hours |
| **Dependencies** | T-001 |
| **Definition of Done** | `mvn flyway:migrate` succeeds on clean PostgreSQL. All 24 tables created. All FK constraints and indexes verified via `\d table_name`. Seed data present. Views return empty result sets (expected, no data yet). `mvn flyway:undo` support scripts created. |

---

### T-006: Docker Compose & Application Profiles

| Field | Value |
|---|---|
| **ID** | T-006 |
| **Description** | Create `docker-compose.yml` (PostgreSQL 16, MongoDB 7, application). Create `Dockerfile` (multi-stage build: Maven compile → JRE 17 runtime). Create `.env.example` with all env vars. Create `application.yml` (common config), `application-local.yml` (H2 in-memory, debug logging, devtools), `application-dev.yml` (local PG+Mongo, info logging), `application-staging.yml` (cloud PG+Mongo, JSON logging), `application-prod.yml` (hardened, JSON ELK logging). Configure HikariCP connection pooling (max 20), Flyway auto-migration, JWT secret/expiry, CORS origins, encryption key. |
| **Priority** | **P1** — Needed soon |
| **Estimated Time** | 2 hours |
| **Dependencies** | T-001 |
| **Definition of Done** | `docker-compose up` starts all 3 containers. Application connects to PostgreSQL and MongoDB. `local` profile uses H2 without external DB dependency. Flyway runs migrations on startup. `docker-compose down` cleans up. |

---

## Phase 1: Authentication Module (4 tasks)

### T-101: Auth — Domain Layer

| Field | Value |
|---|---|
| **ID** | T-101 |
| **Description** | Create auth domain entities: `User` (id, email, passwordHash, firstName, lastName, phone, status, failedLoginAttempts, lockedUntil, lastLoginAt, passwordChangedAt), `Role` (id, name, description, isSystem), `RefreshToken` (id, userId, token, expiresAt, revoked, revokedAt). Create value objects: `EmailAddress`, `PasswordHash`. Create `UserRepository` interface (findByEmail, existsByEmail). Create enum `UserStatus`, `RoleName`. Create domain exceptions: `EmailAlreadyRegisteredException`, `AccountLockedException`. |
| **Priority** | **P0** |
| **Estimated Time** | 2 hours |
| **Dependencies** | T-003 |
| **Definition of Done** | All domain classes have no framework annotations. Repository interface returns `Optional<User>`. `User` entity has behaviour methods: `incrementFailedAttempts()`, `resetFailedAttempts()`, `lock()`, `isLocked()`. Unit tests prove behaviour works. |

---

### T-102: Auth — Application Layer

| Field | Value |
|---|---|
| **ID** | T-102 |
| **Description** | Create use cases: `RegisterUseCase` (validate email uniqueness, hash password with BCrypt-12, create user, assign role, fire `UserRegisteredEvent`), `LoginUseCase` (load user, check locked, verify password, update lastLogin, return UserPrincipal). Create ports: `RegisterUseCase` (inbound), `AuthenticationPort` (outbound for security), `PasswordEncoderPort` (outbound). Create DTOs: `RegisterRequest`, `LoginRequest`, `AuthResponse` (accessToken, refreshToken, user), `TokenRefreshRequest`. Create mappers. |
| **Priority** | **P0** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-101 |
| **Definition of Done** | Use case unit tests with mocked repository: successful register, duplicate email returns error, weak password returns validation error, successful login, locked account login, invalid password login. |

---

### T-103: Auth — Infrastructure Layer

| Field | Value |
|---|---|
| **ID** | T-103 |
| **Description** | Create JPA entities: `UserJpaEntity`, `RoleJpaEntity`, `UserRoleJpaEntity`, `RefreshTokenJpaEntity`, `PasswordHistoryJpaEntity`. Create Spring Data repositories: `UserJpaRepository`, `RoleJpaRepository`, `UserRoleJpaRepository`, `RefreshTokenJpaRepository`, `PasswordHistoryJpaRepository`. Create MapStruct mappers: `UserEntityMapper` (UserJpaEntity ↔ User), `RoleEntityMapper`. Create `JpaUserRepositoryAdapter` implementing `UserRepository`. Create `JwtTokenProviderAdapter` for authentication port. |
| **Priority** | **P0** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-005, T-101, T-102 |
| **Definition of Done** | Integration tests with Testcontainers: persist user to PostgreSQL, retrieve by email, verify mapping. `JwtTokenProviderAdapter` generates tokens that `JwtAuthenticationFilter` accepts. Password encoder BCrypt-12 working. |

---

### T-104: Auth — REST Controllers & Thymeleaf Views

| Field | Value |
|---|---|
| **ID** | T-104 |
| **Description** | Create `AuthController` REST endpoints: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`, `PUT /api/v1/auth/me`, `PUT /api/v1/auth/me/password`, `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`. Create request DTOs with `jakarta.validation` annotations. Create Thymeleaf auth pages: `login.html`, `register.html`, `forgot-password.html`, `reset-password.html`. Create `AuthWebController` for view rendering. Create Thymeleaf layout templates: `default.html` (sidebar + navbar + content), `auth.html` (centered form layout). Create reusable fragments: `header.html`, `footer.html`, `sidebar.html`, `alerts.html`. |
| **Priority** | **P0** |
| **Estimated Time** | 3 hours |
| **Dependencies** | T-004, T-102, T-103 |
| **Definition of Done** | All 9 auth endpoints functional tested via Postman/curl. Password strength bar works on register page. Login redirects to dashboard. Invalid credentials show inline error. Token refresh rotates tokens. Auth templates render correctly with Bootstrap 5 styling. Error pages (404, 500, access-denied) render. |

---

## Phase 2: Common Infrastructure (3 tasks)

### T-201: Audit Logging AOP Aspect

| Field | Value |
|---|---|
| **ID** | T-201 |
| **Description** | Create `@Auditable` annotation (action, resourceType). Create `AuditAspect` AOP aspect that intercepts all `@Auditable`-annotated methods, captures traceId/actorId/actorRole from MDC, serializes method args (old value) and result (new value), builds `AuditLogEntry` object, persists to MongoDB `audit_logs` collection. Create `AuditLogRepository` (Spring Data MongoDB). Create `@Auditable` usage on all write-use-case methods in application layer. |
| **Priority** | **P1** |
| **Estimated Time** | 2 hours |
| **Dependencies** | T-004, T-006 |
| **Definition of Done** | Creating a property via API produces a corresponding audit log entry in MongoDB. Audit entry contains correct traceId, actorId, action, resourceType, resourceId, oldValue (null for create), newValue. |

---

### T-202: Standard Paginated Response Utility

| Field | Value |
|---|---|
| **ID** | T-202 |
| **Description** | Create generic `PagedResponse<T>` class with fields: content, page, size, totalElements, totalPages, last, first, sort. Create `PageableBuilder` utility for constructing `Pageable` from query parameters (page, size, sort). Create `SortBuilder` for parsing sort strings like `"createdAt,desc"`. Implement across all list endpoints. |
| **Priority** | **P1** |
| **Estimated Time** | 1.5 hours |
| **Dependencies** | T-002 |
| **Definition of Done** | GET endpoint with `?page=0&size=5&sort=createdAt,desc` returns paginated JSON matching the standard envelope. Page 0 of 3 returns first=true, last=false. Page 2 of 3 returns last=true. Invalid sort field handled gracefully. |

---

### T-203: Thymeleaf Layout Fragments & Error Pages

| Field | Value |
|---|---|
| **ID** | T-203 |
| **Description** | Create complete Thymeleaf layout system: `layouts/default.html` (sidebar + top navbar + content area with Thymeleaf fragment includes + CSRF token injection in forms), `layouts/auth.html` (centered card layout for login/register). Create fragments: `fragments/header.html` (brand + search + notifications dropdown + user menu), `fragments/footer.html` (version, copyright), `fragments/sidebar.html` (role-based menu rendering, collapsible), `fragments/alerts.html` (success/error/warning/info toast templates). Create error pages: `error/404.html`, `error/500.html`, `error/access-denied.html`. |
| **Priority** | **P1** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-104 |
| **Definition of Done** | All page templates render with consistent layout. Sidebar shows correct menu items per role. CSRF token present in all forms. Error pages display user-friendly messages. Navbar user dropdown shows profile/settings/logout. Mobile hamburger toggle collapses sidebar. |

---

## Phase 3: Property Management Module (5 tasks)

### T-301: Property — Domain Layer

| Field | Value |
|---|---|
| **ID** | T-301 |
| **Description** | Create domain entities: `Property` (aggregate root — id, name, type, description, address, latitude, longitude, managerId, attributes JSONB, status), `Unit` (id, propertyId, unitNumber, floor, bedrooms, bathrooms, squareFeet, monthlyRent, securityDeposit, status, attributes). Create value objects: `PropertyType` enum, `UnitStatus` enum, `PropertyStatus` enum. Create repository interfaces: `PropertyRepository`, `UnitRepository`. Create domain exceptions: `PropertyNotFoundException`, `UnitNotFoundException`, `DuplicateUnitNumberException`, `UnitNotAvailableException`. |
| **Priority** | **P0** |
| **Estimated Time** | 2 hours |
| **Dependencies** | T-003 |
| **Definition of Done** | `Property` aggregate root manages units collection. Business rules: `addUnit()` validates unique unit number within property, `updateStatus()` validates allowed transitions (RENTED only via Lease). Unit tests for all domain rules pass. No framework annotations on domain classes. |

---

### T-302: Property — Application Layer

| Field | Value |
|---|---|
| **ID** | T-302 |
| **Description** | Create use cases: `CreatePropertyUseCase`, `UpdatePropertyUseCase`, `DeletePropertyUseCase` (soft-delete), `GetPropertyUseCase`, `ListPropertiesUseCase` (paginated with filters: search, type, status, managerId, city, state), `AddUnitUseCase`, `UpdateUnitUseCase`, `DeleteUnitUseCase`, `ListUnitsUseCase` (paginated with filters), `GetUnitUseCase`. Create DTOs: `CreatePropertyRequest`, `PropertyResponse`, `PropertySummary`, `CreateUnitRequest`, `UnitResponse`, `UnitSummary`. Create `PropertyMapper` (domain ↔ DTO). Create specifications for property search/filter. |
| **Priority** | **P0** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-301 |
| **Definition of Done** | All 10 use cases unit tested. `CreatePropertyUseCase` validates required fields. `ListPropertiesUseCase` supports all filter combinations. `DeletePropertyUseCase` sets `deletedAt` (not physical delete). `AddUnitUseCase` rejects duplicate unit numbers. |

---

### T-303: Property — JPA Entities & Repository Adapters

| Field | Value |
|---|---|
| **ID** | T-303 |
| **Description** | Create JPA entities: `PropertyJpaEntity` (with `@Type(JsonType)` for attributes JSONB, `@SQLRestriction` for soft-delete), `UnitJpaEntity`, `PropertyImageJpaEntity`. Create Spring Data repositories: `PropertyJpaRepository`, `UnitJpaRepository`, `PropertyImageJpaRepository`. Create MapStruct mappers: `PropertyEntityMapper`, `UnitEntityMapper`. Create adapters: `JpaPropertyRepositoryAdapter`, `JpaUnitRepositoryAdapter`. Configure `@Convert` for JSONB columns with Hibernate Types library. |
| **Priority** | **P0** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-005, T-301, T-302 |
| **Definition of Done** | Integration tests: persist property with attributes JSONB, query by managerId, soft-delete and verify excluded from normal queries, re-query including deleted via admin method. JSONB read/write round-trips correctly. |

---

### T-304: Property — REST Controllers

| Field | Value |
|---|---|
| **ID** | T-304 |
| **Description** | Create `PropertyController`: `GET /api/v1/properties`, `POST /api/v1/properties`, `GET /api/v1/properties/{id}`, `PUT /api/v1/properties/{id}`, `DELETE /api/v1/properties/{id}`, `GET /api/v1/properties/{propertyId}/units`, `POST /api/v1/properties/{propertyId}/units`. Create `UnitController`: `GET /api/v1/units/{id}`, `PUT /api/v1/units/{id}`, `DELETE /api/v1/units/{id}`. Add `@PreAuthorize` annotations per RBAC matrix. Add `@Auditable` on all write methods. Add `@Valid` on all request bodies. Add `@Version` field for optimistic locking on PUT requests. |
| **Priority** | **P0** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-004, T-302, T-303 |
| **Definition of Done** | All 10 property endpoints tested via MockMvc. POST returns 201 + location header. GET returns 200 with full detail. PUT requires version field, returns 409 on conflict. DELETE returns 204. RBAC enforced: TENANT cannot create properties. Validation errors return 400 with field-level messages. |

---

### T-305: Property — Thymeleaf Views

| Field | Value |
|---|---|
| **ID** | T-305 |
| **Description** | Create Thymeleaf property pages: `property/list.html` (table with search, filter dropdowns, pagination, row click → detail), `property/detail.html` (info card + tab navigation for Units/Leases/Tickets, units sub-table), `property/form.html` (2-column form with validation, address autocomplete fields, attributes section). Create `PropertyWebController` for view rendering. Create `unit/form.html` (inline unit form). Ensure responsive card view on mobile per `UI_FLOW.md`. |
| **Priority** | **P1** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-203, T-304 |
| **Definition of Done** | Property list page renders with search bar working. Clicking a property row navigates to detail. Create property form saves and redirects to detail. Edit property form pre-fills data. Unit tab within property detail shows unit table. Mobile view shows cards instead of table. Inline validation errors display. |

---

## Phase 4: Tenant Management Module (4 tasks)

### T-401: Tenant — Domain Layer

| Field | Value |
|---|---|
| **ID** | T-401 |
| **Description** | Create domain entity: `Tenant` (id, firstName, lastName, email, phone, emergencyContactName, emergencyContactPhone, governmentIdType, governmentIdNumber, dateOfBirth, employer, annualIncome, notes, preferredContactMethod, preferredLanguage, status). Create value objects: `TenantStatus` enum, `ContactMethod` enum, `DocumentType` enum. Create repository interface: `TenantRepository`. Create domain exceptions: `TenantNotFoundException`, `DuplicateTenantEmailException`, `TenantHasActiveLeaseException`. |
| **Priority** | **P0** |
| **Estimated Time** | 1.5 hours |
| **Dependencies** | T-003 |
| **Definition of Done** | `Tenant` entity behaves as documented. Status transitions (ACTIVE→INACTIVE, FORMER, BLACKLISTED) validated. Email uniqueness enforced at domain level. No framework dependencies. Unit tests cover creation, status transitions, and email validation. |

---

### T-402: Tenant — Application Layer

| Field | Value |
|---|---|
| **ID** | T-402 |
| **Description** | Create use cases: `CreateTenantUseCase`, `UpdateTenantUseCase`, `DeleteTenantUseCase` (soft-delete, blocked if active lease), `GetTenantUseCase`, `ListTenantsUseCase` (paginated with search by name/email/phone, filter by status/propertyId), `UploadTenantDocumentUseCase`, `GetTenantDocumentsUseCase`. Create DTOs: `CreateTenantRequest`, `TenantResponse`, `TenantSummary`, `TenantDocumentResponse`. Create mappers. |
| **Priority** | **P0** |
| **Estimated Time** | 2 hours |
| **Dependencies** | T-401 |
| **Definition of Done** | All use cases unit tested with mocked repository. `DeleteTenantUseCase` returns 422 if tenant has active lease. `ListTenantsUseCase` returns correct results for each filter combination. Tenant document use cases handle file upload metadata correctly. |

---

### T-403: Tenant — Infrastructure & Controllers

| Field | Value |
|---|---|
| **ID** | T-403 |
| **Description** | Create JPA entity: `TenantJpaEntity` (with `@Encrypted` for PII columns via custom converter). Create support entities: `TenantContactJpaEntity`, `TenantDocumentMetadataJpaEntity`. Create Spring Data repositories. Create MapStruct mapper: `TenantEntityMapper`. Create adapters. Create `TenantController`: `GET/POST /api/v1/tenants`, `GET/PUT/DELETE /api/v1/tenants/{id}`, `POST /api/v1/tenants/{id}/documents`, `GET /api/v1/tenants/{id}/documents`. Add `@PreAuthorize` and `@Auditable`. Implement file upload to MongoDB GridFS. |
| **Priority** | **P0** |
| **Estimated Time** | 3 hours |
| **Dependencies** | T-005, T-402 |
| **Definition of Done** | All tenant CRUD endpoints tested via MockMvc. PII fields encrypted in database (verify via raw SQL query). File upload stores file in GridFS, metadata in PostgreSQL. Document download returns file. RBAC: TENANT can only view own profile. |

---

### T-404: Tenant — Thymeleaf Views

| Field | Value |
|---|---|
| **ID** | T-404 |
| **Description** | Create Thymeleaf pages: `tenant/list.html` (table with search, status filter, row click → detail, responsive card view on mobile), `tenant/detail.html` (profile card + lease history table + documents tab with upload), `tenant/form.html` (create/edit form with sections: Personal Info, Emergency Contact, Employment, Preferences). Create `TenantWebController`. Implement document upload within tenant detail page. |
| **Priority** | **P1** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-203, T-403 |
| **Definition of Done** | Tenant list renders with working search. Clicking row shows detail with lease history. Create form saves correctly. Edit form pre-fills. Document upload within detail tab stores and displays file. Mobile responsive. |

---

## Phase 5: Lease Management Module (5 tasks)

### T-501: Lease — Domain Layer

| Field | Value |
|---|---|
| **ID** | T-501 |
| **Description** | Create domain entities: `Lease` (aggregate root — id, leaseNumber, propertyId, unitId, tenantId, coTenants, startDate, endDate, terminationDate, terminationReason, terminationPenalty, baseRent, securityDeposit, rentDueDay, paymentFrequency, status, termsConditions, notes), `RentSchedule` (id, leaseId, effectiveFrom, effectiveTo, baseRent, escalationPct, escalationFreq, discountPct, discountDesc, isActive), `SecurityDepositLedger` (id, leaseId, entryType, amount, balanceAfter, description). Create value objects: `LeaseStatus` enum, `LeaseNumberGenerator`. Create repository interfaces: `LeaseRepository`, `RentScheduleRepository`, `SecurityDepositLedgerRepository`. Create domain exceptions: `LeaseNotFoundException`, `LeaseOverlapException`, `InvalidLeaseStatusTransitionException`, `LeaseNotActiveException`. |
| **Priority** | **P0** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-003, T-301 |
| **Definition of Done** | `Lease` entity validates: no overlapping lease for unit, no overlapping lease for tenant, end date > start date, rent due day 1-28, status transitions (DRAFT→ACTIVE→EXPIRED/TERMINATED/RENEWED). `Lease.isActive()` = within date range + ACTIVE status. `calculateProratedRent()` for mid-period termination. Unit tests cover all rules. |

---

### T-502: Lease — Application Layer

| Field | Value |
|---|---|
| **ID** | T-502 |
| **Description** | Create use cases: `CreateLeaseUseCase` (validate no overlap, create lease, update unit status → RENTED, fire `LeaseSignedEvent`), `UpdateLeaseUseCase`, `TerminateLeaseUseCase` (set termination info, update unit status → AVAILABLE, fire `LeaseTerminatedEvent`), `RenewLeaseUseCase` (create new lease linked to previous, set old to RENEWED), `GetLeaseUseCase`, `ListLeasesUseCase` (paginated with filters: status, propertyId, unitId, tenantId, expiry range), `GetRentSchedulesUseCase`, `AddRentScheduleUseCase`, `GetDepositLedgerUseCase`. Create DTOs and mappers. |
| **Priority** | **P0** |
| **Estimated Time** | 3 hours |
| **Dependencies** | T-501 |
| **Definition of Done** | All use cases unit tested. `CreateLeaseUseCase` returns `LeaseOverlapException` for double-booking. `RenewLeaseUseCase` creates new lease with incremented date. `TerminateLeaseUseCase` updates unit status. `LeaseSignedEvent` and `LeaseTerminatedEvent` fired correctly. |

---

### T-503: Lease — Infrastructure Layer

| Field | Value |
|---|---|
| **ID** | T-503 |
| **Description** | Create JPA entities: `LeaseJpaEntity` (with `@Version` for optimistic locking), `RentScheduleJpaEntity`, `SecurityDepositLedgerJpaEntity`. Create Spring Data repositories with custom queries: `findOverlappingLeases(unitId, startDate, endDate)` using JPQL, `findActiveByUnitId`, `findExpiringWithinDays`. Create MapStruct mappers. Create adapters. Create `LeaseNumberGenerator` implementation (format: `LS-{year}-{sequential}`). |
| **Priority** | **P0** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-005, T-501, T-502 |
| **Definition of Done** | Integration tests: create lease, verify overlapping lease query returns results, verify optimistic locking catches concurrent updates, verify rent schedule cascade save. Custom JPQL `findOverlappingLeases` works for edge cases (same dates, contained dates, overlapping dates). |

---

### T-504: Lease — REST Controllers

| Field | Value |
|---|---|
| **ID** | T-504 |
| **Description** | Create `LeaseController`: `GET/POST /api/v1/leases`, `GET/PUT /api/v1/leases/{id}`, `POST /api/v1/leases/{id}/terminate`, `POST /api/v1/leases/{id}/renew`, `GET/POST /api/v1/leases/{leaseId}/rent-schedules`, `GET /api/v1/leases/{leaseId}/deposit-ledger`. Add `@PreAuthorize` (lease:*, lease:write, lease:read). Add `@Auditable` and `@Valid`. Handle version conflicts with 409. |
| **Priority** | **P0** |
| **Estimated Time** | 2 hours |
| **Dependencies** | T-004, T-502, T-503 |
| **Definition of Done** | All lease endpoints tested via MockMvc. Create lease returns 201 with generated lease number. Create overlapping lease returns 422. Terminate lease updates status. Renew creates new linked lease. Version conflict returns 409 with error message. |

---

### T-505: Lease — Thymeleaf Wizard Views

| Field | Value |
|---|---|
| **ID** | T-505 |
| **Description** | Create Thymeleaf pages: `lease/list.html` (table with status badges, expiry indicators, property filter), `lease/detail.html` (lease info card + tabs: rent schedules, deposit ledger, invoices, documents). Create 3-step wizard: `lease/create-step1.html` (select property + available unit table), `lease/create-step2.html` (select tenant + co-tenants), `lease/create-step3.html` (lease terms form). Create `LeaseWebController` with wizard session management. Create termination and renewal forms. |
| **Priority** | **P1** |
| **Estimated Time** | 3 hours |
| **Dependencies** | T-203, T-504 |
| **Definition of Done** | Lease wizard step 1 shows only properties user manages, step 2 shows eligible tenants, step 3 shows confirmation before create. Navigation between steps works (next/back). Termination form pre-fills penalty. Renewal form shows new dates. Responsive layout maintained. |

---

## Phase 6: Rent Collection Module (5 tasks)

### T-601: Rent — Domain Layer

| Field | Value |
|---|---|
| **ID** | T-601 |
| **Description** | Create domain entities: `Invoice` (id, invoiceNumber, leaseId, unitId, tenantId, periodStart, periodEnd, dueDate, baseAmount, lateFeeAmount, discountAmount, adjustmentAmount, totalAmount, paidAmount, balanceDue, status, notes, version), `Payment` (id, paymentNumber, invoiceId, tenantId, amount, paymentDate, paymentMethod, referenceNumber, notes, status, reconciled), `PaymentLedger` (id, paymentId, invoiceId, entryType, amount, invoiceBalanceBefore, invoiceBalanceAfter, description), `Receipt` (id, receiptNumber, paymentId, invoiceId, tenantId, receiptData, generatedAt), `LateFeeRule` (id, name, gracePeriodDays, feeType, feeValue, feeCap, recurrence, isActive). Create value objects: `InvoiceStatus` enum, `PaymentStatus` enum, `PaymentMethod` enum, `FeeType` enum. Create repository interfaces. Create domain exceptions: `InvoiceNotFoundException`, `InvoiceAlreadyPaidException`, `PaymentExceedsBalanceException`, `InvalidPaymentAmountException`. |
| **Priority** | **P0** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-003 |
| **Definition of Done** | `Invoice` domain calculates `balanceDue = totalAmount - paidAmount`. `Invoice.addPayment(amount)` updates paidAmount, recalculates balance, transitions status PENDING→PARTIALLY_PAID→PAID. `LateFeeRule.calculateFee(balance, daysOverdue)` applies formula correctly. Unit tests for all financial calculations. |

---

### T-602: Rent — Application Layer

| Field | Value |
|---|---|
| **ID** | T-602 |
| **Description** | Create use cases: `GenerateInvoiceUseCase` (for lease, period, dueDate — computes total from rent schedule), `RecordPaymentUseCase` (validate amount ≤ balance, create payment, update invoice, create ledger entry, generate receipt, fire `RentPaidEvent`), `GetInvoiceUseCase`, `ListInvoicesUseCase` (paginated, filter by status/lease/tenant/property/dueDate/overdue), `GetPaymentUseCase`, `ListPaymentsUseCase`, `GetReceiptUseCase`, `GetAgingReportUseCase` (bucket grouping), `ApplyLateFeesUseCase` (find overdue invoices past grace period, calculate and apply late fee). Create DTOs and mappers. |
| **Priority** | **P0** |
| **Estimated Time** | 3 hours |
| **Dependencies** | T-601 |
| **Definition of Done** | `GenerateInvoiceUseCase` creates invoice with correct amounts from rent schedule. `RecordPaymentUseCase` handles full payment, partial payment, and overpayment (rejected). `GetAgingReportUseCase` returns correct bucket counts. `ApplyLateFeesUseCase` only applies to invoices past grace period. All use cases unit tested. |

---

### T-603: Rent — Infrastructure Layer

| Field | Value |
|---|---|
| **ID** | T-603 |
| **Description** | Create JPA entities: `InvoiceJpaEntity` (with `@Version`), `PaymentJpaEntity`, `PaymentLedgerJpaEntity`, `ReceiptJpaEntity`, `LateFeeRuleJpaEntity`. Create Spring Data repositories with custom queries: `findOverdueInvoices(asOfDate)`, `findAgingBuckets(propertyId)`, `findInvoicesPastGracePeriod(graceDays, asOfDate)`. Create MapStruct mappers. Create adapters. Implement `InvoiceNumberGenerator` (format: `INV-{year}-{month}-{sequential}`), `PaymentNumberGenerator`, `ReceiptNumberGenerator`. |
| **Priority** | **P0** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-005, T-601, T-602 |
| **Definition of Done** | Integration tests: generate invoice, record payment, verify invoice status updated to PAID, verify balance correct. `findOverdueInvoices` returns correct results. `findAgingBuckets` query groups correctly. Version conflict handled on concurrent invoice updates. |

---

### T-604: Rent — REST Controllers

| Field | Value |
|---|---|
| **ID** | T-604 |
| **Description** | Create `InvoiceController`: `GET /api/v1/invoices`, `GET /api/v1/invoices/{id}`, `POST /api/v1/invoices/generate`, `POST /api/v1/invoices/apply-late-fees`. Create `PaymentController`: `POST /api/v1/payments`, `GET /api/v1/payments`, `GET /api/v1/payments/{id}`. Create `ReceiptController`: `GET /api/v1/receipts/{id}`. Create `ReportController`: `GET /api/v1/reports/aging`. Add `@PreAuthorize`, `@Auditable`, `@Valid`. |
| **Priority** | **P0** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-004, T-602, T-603 |
| **Definition of Done** | All rent endpoints tested via MockMvc. Invoice generation creates correct invoices. Payment recording updates invoice. Aging report returns bucketed data. Late fee application updates overdue invoices. TENANT can only view own invoices. |

---

### T-605: Rent — Thymeleaf Views

| Field | Value |
|---|---|
| **ID** | T-605 |
| **Description** | Create Thymeleaf pages: `rent/invoices.html` (table with status color-coded badges, overdue badges, filter dropdowns, click row → detail), `rent/invoice-detail.html` (amount breakdown card + payment history table + [Record Payment] button), `rent/payment-form.html` (record payment form with invoice context), `rent/receipt.html` (printable receipt view), `rent/aging-report.html` (bucket summary chart + detail table + export CSV button). Create `RentWebController`. Include aging report with bucket color coding (green/yellow/orange/red). |
| **Priority** | **P1** |
| **Estimated Time** | 3 hours |
| **Dependencies** | T-203, T-604 |
| **Definition of Done** | Invoice list renders with color-coded status badges. Overdue invoices show red badge with days. Invoice detail shows breakdown. Recording payment updates invoice status on page. Receipt page is printable. Aging report shows 5 buckets with amounts and percentages. Mobile responsive. |

---

## Phase 7: Maintenance Tickets Module (5 tasks)

### T-701: Maintenance — Domain Layer

| Field | Value |
|---|---|
| **ID** | T-701 |
| **Description** | Create domain entities: `MaintenanceTicket` (id, ticketNumber, unitId, propertyId, reporterId, assigneeId, vendorId, title, description, category, priority, status, slaDeadline, slaBreached, slaBreachedAt, resolvedAt, closedAt, resolutionNotes, cost, version), `Vendor` (id, name, contactName, email, phone, tradeSpecialty, hourlyRate, insuranceProof, rating, notes, status), `TicketAssignment` (id, ticketId, assignedTo, assignedBy, assignmentNote, assignedAt), `SlaPolicy` (id, priority, responseTimeHours, resolutionTimeHours, escalationAfterHours). Create value objects: `TicketStatus` enum, `TicketPriority` enum, `TicketCategory` enum, `VendorStatus` enum. Create repository interfaces. Create domain exceptions: `TicketNotFoundException`, `InvalidTicketStatusTransitionException`, `SlaBreachedException`. |
| **Priority** | **P0** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-003 |
| **Definition of Done** | `MaintenanceTicket` validates status transitions: OPEN→ASSIGNED→IN_PROGRESS→RESOLVED→CLOSED (and REOPENED from CLOSED). Invalid transitions return exception. `SlaPolicy` computes correct `slaDeadline` based on priority. `Vendor` entity validates trade specialty. Unit tests cover all state transitions and SLA computation. |

---

### T-702: Maintenance — Application Layer

| Field | Value |
|---|---|
| **ID** | T-702 |
| **Description** | Create use cases: `CreateTicketUseCase` (compute SLA deadline from priority, fire `TicketCreatedEvent`), `UpdateTicketStatusUseCase` (validate transition, update status, update resolvedAt/closedAt, fire `TicketResolvedEvent`), `AssignTicketUseCase` (set assignee, create assignment record, update status→ASSIGNED), `ResolveTicketUseCase`, `GetTicketUseCase`, `ListTicketsUseCase` (paginated with filters: status, priority, propertyId, unitId, assigneeId, category, slaBreached), `AddCommentUseCase` (save to MongoDB), `GetCommentsUseCase`, `CreateVendorUseCase`, `ListVendorsUseCase`. Create DTOs and mappers. |
| **Priority** | **P0** |
| **Estimated Time** | 3 hours |
| **Dependencies** | T-701 |
| **Definition of Done** | All use cases unit tested. `CreateTicketUseCase` computes SLA deadline. `UpdateTicketStatusUseCase` validates allowed transitions per role. `AssignTicketUseCase` creates assignment record. `AddCommentUseCase` saves to MongoDB. SLA breach detection is part of `ListTicketsUseCase`. |

---

### T-703: Maintenance — Infrastructure & MongoDB Integration

| Field | Value |
|---|---|
| **ID** | T-703 |
| **Description** | Create JPA entities: `MaintenanceTicketJpaEntity` (with `@Version`), `VendorJpaEntity`, `TicketAssignmentJpaEntity`, `TicketAttachmentJpaEntity`, `SlaPolicyJpaEntity`. Create Spring Data JPA repositories. Create MongoDB document: `TicketCommentDocument` (id, ticketId, authorId, authorRole, authorName, body, attachments, isInternal, createdAt). Create `TicketCommentMongoRepository`. Create MapStruct mappers. Create adapters. Implement `TicketNumberGenerator` (format: `TK-{year}-{sequential}`). Implement SLA breach detection scheduled task (runs every 15 min). |
| **Priority** | **P0** |
| **Estimated Time** | 3 hours |
| **Dependencies** | T-005, T-006, T-701, T-702 |
| **Definition of Done** | Integration tests: create ticket in PostgreSQL, add comment in MongoDB, verify cross-DB retrieval (ticket with comments). SLA breach detection correctly flags tickets past deadline. Ticket number generation produces sequential numbers. |

---

### T-704: Maintenance — REST Controllers

| Field | Value |
|---|---|
| **ID** | T-704 |
| **Description** | Create `TicketController`: `GET/POST /api/v1/tickets`, `GET /api/v1/tickets/{id}`, `PUT /api/v1/tickets/{id}/status`, `POST /api/v1/tickets/{id}/assign`, `POST /api/v1/tickets/{id}/resolve`, `GET/POST /api/v1/tickets/{ticketId}/comments` (multipart for file uploads). Create `VendorController`: `GET/POST /api/v1/vendors`. Add `@PreAuthorize` (TENANT can only create/view own tickets, VENDOR can update assigned tickets). Add `@Auditable`. Handle file uploads with size validation (max 5 files, 10 MB each). |
| **Priority** | **P0** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-004, T-702, T-703 |
| **Definition of Done** | All ticket endpoints tested via MockMvc. Ticket creation sets SLA deadline. Status transitions validated. Invalid transitions return 422. RBAC enforced: VENDOR can only update assigned tickets. File upload stores correctly. Comments save to MongoDB and return with ticket detail. |

---

### T-705: Maintenance — Thymeleaf Views

| Field | Value |
|---|---|
| **ID** | T-705 |
| **Description** | Create Thymeleaf pages: `maintenance/list.html` (table with priority color badges, SLA breach indicator, filter by status/priority/property, responsive card view), `maintenance/detail.html` (ticket info card + SLA timer + threaded comments section + attachments + action buttons per role), `maintenance/form.html` (create ticket form with property/unit dropdown cascade, category selector, priority selector, file upload). Create `VendorWebController`: `vendors/list.html`. Create `MaintenanceWebController`. Implement real-time SLA countdown using CSS animation for URGENT tickets. |
| **Priority** | **P1** |
| **Estimated Time** | 3 hours |
| **Dependencies** | T-203, T-704 |
| **Definition of Done** | Ticket list shows priority badges (red/orange/blue/gray), SLA deadline countdown. Ticket detail shows threaded comments, attachments, and role-specific action buttons. Create ticket form cascades property→unit, allows file upload. Comment form works within detail page. Vendor list page renders. Mobile responsive. |

---

## Phase 8: Dashboard & Cross-Cutting (5 tasks)

### T-801: Dashboard — Application Layer

| Field | Value |
|---|---|
| **ID** | T-801 |
| **Description** | Create dashboard services: `OccupancyDashboardService` (total units, available, rented, maintenance, occupancy rate by property and portfolio), `FinancialDashboardService` (MTD collected, total outstanding, collection rate, delinquency buckets, revenue trend 12 months), `MaintenanceDashboardService` (open tickets, avg resolution hours, breached SLA, tickets by priority/category), `LeaseExpiryDashboardService` (expiring in 30/60/90 days). Create `DashboardAggregatorService` that combines all 4 services into a single dashboard response. Create DTOs: `PortfolioDashboardResponse`, `PropertyDashboardResponse`, `DashboardOccupancy`, `DashboardFinancial`, `DashboardMaintenance`, `DashboardLeaseExpiry`, `Alert`. |
| **Priority** | **P0** |
| **Estimated Time** | 2.5 hours |
| **Dependencies** | T-301, T-501, T-601, T-701 |
| **Definition of Done** | Dashboard services query via PostgreSQL views (`vw_dashboard_*`). `DashboardAggregatorService` returns combined response. All services unit tested with mocked repository data. Revenue trend returns 12 months of data. Delinquency buckets match aging report. |

---

### T-802: Dashboard — REST Controllers & Thymeleaf Views

| Field | Value |
|---|---|
| **ID** | T-802 |
| **Description** | Create `DashboardController`: `GET /api/v1/dashboard/portfolio` (portfolio-wide KPIs), `GET /api/v1/dashboard/property/{propertyId}` (single property KPIs), `GET /api/v1/dashboard/me` (tenant self-service). Create `DashboardWebController` for view rendering. Create Thymeleaf pages: `dashboard/index.html` (4 KPI cards + revenue trend chart placeholder + occupancy by property bar chart + alerts section + lease expiry timeline), `dashboard/property.html` (focused view for single property). Use Bootstrap cards, progress bars, and badge components. Chart placeholders using Chart.js CDN (bar chart for occupancy, line chart for revenue trend). |
| **Priority** | **P0** |
| **Estimated Time** | 3 hours |
| **Dependencies** | T-203, T-801 |
| **Definition of Done** | Portfolio dashboard renders all KPIs from API. KPI cards show values with trend indicators (▲/▼). Alerts section shows CRITICAL/WARNING items. Lease expiry timeline shows visual bars. Tenant dashboard shows only self data. Chart.js renders real data (not mock). Responsive: 4 columns desktop, 2 tablet, 1 mobile. |

---

### T-803: Scheduled Tasks & Notifications

| Field | Value |
|---|---|
| **ID** | T-803 |
| **Description** | Create scheduled tasks (Spring `@Scheduled`): `InvoiceGenerationJob` (runs 1st of month, generates invoices for all active leases), `LateFeeApplicationJob` (runs daily, applies late fees to overdue invoices past grace period), `SlaBreachCheckJob` (runs every 15 min, flags breached tickets), `LeaseExpiryAlertJob` (runs daily, sends alerts for leases expiring within 30 days), `PaymentReminderJob` (runs daily, flags invoices due in 7 days for reminder). Create `DashboardSnapshotJob` (runs hourly, pre-computes dashboard snapshots to MongoDB for fast retrieval). Log all job executions with counts. |
| **Priority** | **P1** |
| **Estimated Time** | 3 hours |
| **Dependencies** | T-602, T-702, T-801 |
| **Definition of Done** | Scheduled tasks run at correct intervals. Invoice generation creates invoices only for leases without existing invoice for period. Late fee application respects grace period. SLA breach flags tickets correctly. Dashboard snapshots stored in MongoDB `dashboard_snapshots` collection. All jobs logged with start/end/count. |

---

### T-804: Architecture & Compliance Tests (ArchUnit)

| Field | Value |
|---|---|
| **ID** | T-804 |
| **Description** | Create ArchUnit test classes: `LayerDependencyTest` (domain must not depend on Spring, application must not depend on infrastructure, presentation must not depend on infrastructure), `NamingConventionTest` (all classes follow PascalCase, all interfaces follow naming patterns, all packages follow convention), `AnnotationTest` (no `@Autowired` field injection, no `@Data` on JPA entities, all controllers have `@PreAuthorize` or permit all), `TransactionalTest` (all application public methods are `@Transactional`), `ExceptionHierarchyTest` (all exceptions extend `SmartLeaseException`). Create JaCoCo exclusion for generated classes (MapStruct mappers). |
| **Priority** | **P1** |
| **Estimated Time** | 2 hours |
| **Dependencies** | T-104, T-304, T-403, T-504, T-604, T-704, T-802 |
| **Definition of Done** | All ArchUnit tests pass. `mvn test` includes architecture tests. Violations fail the build. Reports generated. JaCoCo excludes MapStruct mappers from coverage requirements. |

---

### T-805: End-to-End Integration Tests

| Field | Value |
|---|---|
| **ID** | T-805 |
| **Description** | Create comprehensive integration tests using Testcontainers (PostgreSQL + MongoDB): `FullLeaseLifecycleIT` (register manager → create property → add unit → register tenant → create lease → generate invoice → record payment → terminate lease), `MaintenanceWorkflowIT` (tenant creates ticket → manager assigns vendor → vendor updates to in-progress → vendor resolves → manager closes), `AuthenticationFlowIT` (register → login → access protected resource → refresh token → logout → verify token invalid). Test RBAC enforcement: TENANT cannot access property admin endpoints. Test cross-DB consistency (ticket comments in MongoDB, ticket in PostgreSQL). |
| **Priority** | **P1** |
| **Estimated Time** | 3 hours |
| **Dependencies** | All prior tasks |
| **Definition of Done** | All integration tests pass with real PostgreSQL and MongoDB containers. Full lease lifecycle end-to-end verified. Maintenance workflow with status transitions verified. Auth token lifecycle verified. RBAC enforced in integration tests. Cross-DB data consistency verified. `mvn verify` runs integration tests (failsafe plugin). |

---

## Task Dependency Graph

```
T-001 (Scaffold)
 ├── T-002 (Entry Point)
 │    ├── T-003 (Value Objects)
 │    │    ├── T-101 → T-102 → T-103 → T-104  (Auth Module)
 │    │    ├── T-301 → T-302 → T-303 → T-304 → T-305  (Property)
 │    │    ├── T-401 → T-402 → T-403 → T-404  (Tenant)
 │    │    ├── T-501 → T-502 → T-503 → T-504 → T-505  (Lease)
 │    │    ├── T-601 → T-602 → T-603 → T-604 → T-605  (Rent)
 │    │    ├── T-701 → T-702 → T-703 → T-704 → T-705  (Maintenance)
 │    │    └── T-801 → T-802 (Dashboard)
 │    ├── T-004 (Security) ──→ (all controllers)
 │    └── T-202 (Pagination) ──→ (all list endpoints)
 ├── T-005 (Migrations) ──→ (all infrastructure tasks)
 ├── T-006 (Docker Compose)
 │    └── T-201 (Audit) ──→ (all application tasks)
 └── T-203 (Layouts) ──→ (all view tasks)
```

---

## Execution Strategy

### Phase Ordering

```
Phase 0: Foundation        (T-001 to T-006)    →   6 tasks   →   ~15 hours
Phase 1: Auth              (T-101 to T-104)    →   4 tasks   →   ~10 hours
Phase 2: Common Infra      (T-201 to T-203)    →   3 tasks   →   ~6 hours
Phase 3: Property          (T-301 to T-305)    →   5 tasks   →   ~12 hours
Phase 4: Tenant            (T-401 to T-404)    →   4 tasks   →   ~9 hours
Phase 5: Lease             (T-501 to T-505)    →   5 tasks   →   ~13 hours
Phase 6: Rent              (T-601 to T-605)    →   5 tasks   →   ~13.5 hours
Phase 7: Maintenance       (T-701 to T-705)    →   5 tasks   →   ~14 hours
Phase 8: Dashboard         (T-801 to T-805)    →   5 tasks   →   ~13.5 hours
                                      Total:  42 tasks   →   ~106 hours
```

### Recommended Parallelization

```
Track A (Backend Core):     T-001 → T-002 → T-003 → T-101→102→103 (Auth infra)
                                                         → T-301→302→303 (Property infra)
                                                         → T-401→402→403 (Tenant infra)
                                                         → T-501→502→503 (Lease infra)
                                                         → T-601→602→603 (Rent infra)
                                                         → T-701→702→703 (Maint infra)

Track B (Frontend Views):   T-203 (Layouts) → T-104 (Auth views)
                                            → T-305 (Property views)
                                            → T-404 (Tenant views)
                                            → T-505 (Lease views)
                                            → T-605 (Rent views)
                                            → T-705 (Maint views)

Track C (Quality):          T-804 → T-805 (Tests) — run continuously after each phase
```

---

> *This task breakdown is designed for 1-2 developers working in parallel over 6-8 weeks.*  
> *Each task is self-contained with clear dependencies and a verifiable Definition of Done.*  
> *For full project context, see [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).*
