# SmartLease — Rental Property Management System

> **Project Context Document** — Architecture, Decisions & Enterprise Standards  
> *Version 1.0*

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Philosophy](#2-architecture-philosophy)
3. [Technology Stack & Justification](#3-technology-stack--justification)
4. [Clean Architecture Layers](#4-clean-architecture-layers)
5. [Module Breakdown](#5-module-breakdown)
6. [Package Structure Convention](#6-package-structure-convention)
7. [Data Flow Architecture](#7-data-flow-architecture)
8. [Database Strategy](#8-database-strategy)
9. [Security Architecture](#9-security-architecture)
10. [API Design Conventions](#10-api-design-conventions)
11. [Enterprise Coding Standards](#11-enterprise-coding-standards)
12. [Error Handling & Logging](#12-error-handling--logging)
13. [Testing Strategy](#13-testing-strategy)
14. [Build & Deployment](#14-build--deployment)
15. [Project Directory Layout](#15-project-directory-layout)

---

## 1. Project Overview

### Vision
SmartLease is a production-grade Rental Property Management System that empowers property owners, managers, and tenants with a unified platform for end-to-end property lifecycle management.

### Core Capabilities
| Capability | Description |
|---|---|
| **Property Lifecycle** | Register, update, and manage residential/commercial properties |
| **Tenant Lifecycle** | Onboard, track, and manage tenant relationships |
| **Lease Contract Mgmt** | Create, renew, terminate leases with audit trails |
| **Rent Automation** | Automated rent calculation, invoice generation, payment tracking |
| **Maintenance Ops** | Ticket creation, assignment, status tracking, vendor management |
| **Financial Dashboard** | Real-time KPIs: occupancy, delinquency, maintenance costs, revenue |

### Key Quality Attributes
- **Security**: Role-Based Access Control (RBAC) with JWT, field-level auditing
- **Scalability**: Stateless API, CQRS-readiness, database separation (SQL + NoSQL)
- **Maintainability**: Clean Architecture with strict dependency inversion
- **Resilience**: Graceful degradation, comprehensive exception handling, structured logging

---

## 2. Architecture Philosophy

### Principles

| Principle | Application |
|---|---|
| **Clean Architecture** | Dependency inversion: Domain → Application → Infrastructure → Presentation |
| **Domain-Driven Design (DDD)** | Rich domain models with ubiquitous language per bounded context |
| **SOLID** | Every class has a single reason to change (SRP), abstractions over concretions (DIP) |
| **API-First** | RESTful contract defined by resource semantics, versioned from day one |
| **Fail-Fast** | Validate at boundaries; never let invalid state propagate |
| **Observability** | Structured logging + metrics at every architectural seam |

### Dependency Rule

```
┌──────────────────────────────────────┐
│         Presentation Layer           │
│   (Controllers, DTOs, Views)        │
├──────────────────────────────────────┤
│         Application Layer            │
│   (Use Cases, Ports, DTOs)          │
├──────────────────────────────────────┤
│         Domain Layer                 │
│   (Entities, Value Objects, Events) │
├──────────────────────────────────────┤
│      Infrastructure Layer           │
│   (Persistence, Messaging, Ext.     │
│    APIs, Security Filters)          │
└──────────────────────────────────────┘
```

**Outer layers depend on inner layers — never the reverse.**

---

## 3. Technology Stack & Justification

| Technology | Version | Purpose | Rationale |
|---|---|---|---|
| **Java** | 17 | Core language | LTS, records, sealed classes, pattern matching for cleaner domain models |
| **Spring Boot** | 3.2.x | Application framework | Auto-configuration, production-ready features, massive ecosystem |
| **Spring Security** | 6.x | AuthN/AuthZ | Industry-standard; seamless JWT + RBAC integration |
| **JWT (jjwt)** | 0.12.x | Stateless tokens | No session store needed; self-contained claims for RBAC |
| **PostgreSQL** | 16 | Primary (relational) DB | ACID compliance, JSONB for flexible property attributes, strong type system |
| **MongoDB** | 7.x | Secondary (document) DB | Ideal for maintenance ticket conversations, audit logs, unstructured metadata |
| **Maven** | 3.9.x | Build tool | Declarative, reproducible builds; multi-module support |
| **Thymeleaf** | 3.1.x | Server-side rendering | Natural templating, Spring Boot integration, fragments/reusable layouts |
| **Bootstrap 5** | 5.3.x | UI framework | Responsive design, accessible components, rapid prototyping |
| **Hibernate/JPA** | 6.x | ORM (PostgreSQL) | Mature, Spring Data JPA integration, optimistic locking |
| **Spring Data MongoDB** | 4.x | ODM (MongoDB) | Repository abstraction for MongoDB collections |
| **Lombok** | 1.18.x | Boilerplate reduction | `@Data`, `@Builder`, `@Value` for clean domain objects |
| **MapStruct** | 1.5.x | Object mapping | Compile-time, type-safe DTO ↔ Entity mapping |
| **JUnit 5 + Mockito** | Latest | Testing | Parameterized tests, BDD-style mocks |
| **Testcontainers** | 1.19.x | Integration testing | Spin up real PostgreSQL/MongoDB containers in CI |
| **Logback + SLF4J** | Latest | Logging | Structured JSON logs, MDC for request tracing |
| **SpringDoc OpenAPI** | 2.3.x | API documentation | Auto-generated OpenAPI 3.0 spec from annotations |

---

## 4. Clean Architecture Layers

### 4.1 Domain Layer (`domain/`)

**Strictly no external dependencies.** Contains only pure Java + framework-agnostic annotations.

| Artifact | Description | Example |
|---|---|---|
| **Entity** | Rich domain object with identity & business behaviour | `Lease` (calculates rent proration, detects expiry) |
| **Value Object** | Immutable, equality-by-value | `Money`, `DateRange`, `EmailAddress`, `PhoneNumber` |
| **Aggregate Root** | Consistency boundary entity | `Property` owns `Unit` collection |
| **Domain Event** | Something meaningful that happened | `LeaseSignedEvent`, `RentPaidEvent` |
| **Repository Interface** | Contract for persistence | `LeaseRepository` (no implementation here) |
| **Specification** | Business rule encapsulations | `OverdueInvoiceSpecification` |

### 4.2 Application Layer (`application/`)

Orchestrates use cases. Depends only on `domain`.

| Artifact | Description | Example |
|---|---|---|
| **Use Case / Service** | Single-responsibility operation | `CreateLeaseUseCase`, `ProcessRentPaymentService` |
| **Inbound Port** | Interface consumed by controllers | `RentCollectionUseCase` |
| **Outbound Port** | Interface implemented by infrastructure | `PaymentGatewayPort`, `NotificationPort` |
| **Application DTO** | Data transfer for I/O | `CreateLeaseRequest`, `RentInvoiceResponse` |
| **Exception** | Application-specific errors | `LeaseExpiredException`, `InsufficientPaymentException` |

### 4.3 Infrastructure Layer (`infrastructure/`)

Implements interfaces defined by domain & application layers.

| Artifact | Description | Example |
|---|---|---|
| **Persistence Adapter** | JPA/Spring Data implementation | `JpaLeaseRepository`, `MongoAuditLogRepository` |
| **Security Adapter** | JWT filter, user details service | `JwtAuthenticationFilter`, `CustomUserDetailsService` |
| **External API Adapter** | Third-party integration | `PaymentGatewayClient`, `EmailNotificationAdapter` |
| **Configuration** | Bean wiring, properties | `SecurityConfig`, `DatabaseConfig` |
| **Mapper** | Entity ↔ Domain model conversion | `LeaseEntityMapper`, `TenantDocumentMapper` |

### 4.4 Presentation Layer (`presentation/`)

| Artifact | Description | Example |
|---|---|---|
| **REST Controller** | API endpoint handler | `LeaseController` |
| **Thymeleaf Controller** | View-returning handler | `DashboardController` |
| **Request DTO** | Input validation | `@Valid CreateLeaseRequest` |
| **Response DTO** | Output shaping | `PagedResponse<LeaseSummary>` |
| **Global Advice** | Cross-cutting exception handling | `GlobalExceptionHandler` |

---

## 5. Module Breakdown

### 5.1 Authentication Module

**Purpose**: Identity management, secure login, token lifecycle.

| Responsibility | Key Classes |
|---|---|
| User registration & profile | `RegisterUseCase`, `UserRepository` |
| Login & JWT issuance | `AuthenticationService`, `JwtTokenProvider` |
| Token refresh & revocation | `RefreshToken`, `TokenBlacklistService` |
| Role & permission management | `Role` (enum), `Permission` (enum) |
| Password policy enforcement | `PasswordPolicyValidator` |

### 5.2 Property Management Module

**Purpose**: Manage property portfolio and unit hierarchy.

| Responsibility | Key Classes |
|---|---|
| CRUD for properties & units | `Property`, `Unit`, `PropertyRepository` |
| Property-Unit hierarchical management | `Property` (aggregate root) with `List<Unit>` |
| Property attributes (flexible schema) | JSONB column `attributes` in PostgreSQL |
| Unit availability & status tracking | `UnitStatus` (AVAILABLE, RENTED, MAINTENANCE) |
| Address normalization | `Address` value object |

### 5.3 Tenant Management Module

**Purpose**: Complete tenant lifecycle.

| Responsibility | Key Classes |
|---|---|
| Tenant onboarding & verification | `Tenant`, `OnboardingWorkflow` |
| Document management | `TenantDocument` (stored via MongoDB GridFS) |
| Tenant-Portfolio relationship | `TenantLeaseHistory` |
| Communication preferences | `CommunicationPreference` (Email/SMS/In-App) |

### 5.4 Lease Management Module

**Purpose**: Lease contract creation and lifecycle.

| Responsibility | Key Classes |
|---|---|
| Lease creation & approval | `Lease`, `LeaseApprovalWorkflow` |
| Lease renewal & termination | `LeaseRenewalService`, `LeaseTerminationService` |
| Rent structure definition | `RentSchedule` (base rent, escalation, discounts) |
| Security deposit management | `SecurityDeposit`, `DepositLedger` |
| Lease document generation | `LeaseDocumentGenerator` |

### 5.5 Rent Collection Module

**Purpose**: Financial operations for rent.

| Responsibility | Key Classes |
|---|---|
| Invoice generation | `InvoiceGenerator`, `RecurringInvoiceScheduler` |
| Payment processing | `Payment`, `PaymentGatewayPort` |
| Delinquency management | `DelinquencyService`, `OverdueInvoiceSpecification` |
| Late fee calculation | `LateFeeCalculator` |
| Payment reconciliation | `PaymentReconciliationService` |
| Receipt generation | `ReceiptGenerator` |

### 5.6 Maintenance Tickets Module

**Purpose**: Issue tracking and resolution.

| Responsibility | Key Classes |
|---|---|
| Ticket creation & assignment | `MaintenanceTicket`, `TicketAssignmentService` |
| Priority & SLA management | `TicketPriority`, `SlaCalculator` |
| Vendor management | `Vendor`, `VendorAssignmentService` |
| Workflow state machine | `TicketStateMachine` (states: OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED) |
| Tenant/vendor communication | `TicketComment` (stored in MongoDB) |

### 5.7 Dashboard Module

**Purpose**: Aggregated insights and KPIs.

| Responsibility | Key Classes |
|---|---|
| Occupancy metrics | `OccupancyDashboardService` (units leased vs total) |
| Financial summaries | `FinancialSummaryService` (total collected, outstanding, delinquent) |
| Maintenance KPIs | `MaintenanceKpiService` (avg resolution time, open tickets) |
| Lease expiry alerts | `LeaseExpiryAlertService` (upcoming renewals) |
| Data aggregation strategy | Read-model queries via PostgreSQL views or MongoDB materialized aggregations |

---

## 6. Package Structure Convention

Each module follows the same internal structure:

```
com.smartlease
├── SmartLeaseApplication.java
│
├── ${module}.domain                         # Domain Layer
│   ├── model                                # Entities & Value Objects
│   │   ├── Lease.java
│   │   └── ...
│   ├── event                                # Domain Events
│   │   ├── LeaseSignedEvent.java
│   │   └── ...
│   ├── repository                           # Repository Interfaces
│   │   └── LeaseRepository.java
│   ├── spec                                 # Specifications
│   │   └── ActiveLeaseSpecification.java
│   └── exception                            # Domain Exceptions
│       └── LeaseNotFoundException.java
│
├── ${module}.application                    # Application Layer
│   ├── port.in                              # Inbound Ports
│   │   └── CreateLeaseUseCase.java
│   ├── port.out                             # Outbound Ports
│   │   └── PaymentGatewayPort.java
│   ├── service                              # Use Case Implementations
│   │   └── CreateLeaseService.java
│   ├── dto                                  # Application DTOs
│   │   ├── CreateLeaseRequest.java
│   │   └── LeaseResponse.java
│   └── mapper                               # Application Mappers
│       └── LeaseMapper.java
│
├── ${module}.infrastructure                 # Infrastructure Layer
│   ├── persistence                          # JPA/Spring Data Implementations
│   │   ├── entity                           # JPA Entities (different from domain)
│   │   │   └── LeaseJpaEntity.java
│   │   ├── repository                       # Spring Data Repositories
│   │   │   └── LeaseJpaRepository.java
│   │   └── mapper                           # Entity ↔ Domain Mappers
│   │       └── LeaseEntityMapper.java
│   ├── security                             # Security Adapters (if applicable)
│   │   └── JwtTokenProvider.java
│   └── config                               # Module Configurations
│       └── LeaseModuleConfig.java
│
└── ${module}.presentation                   # Presentation Layer
    ├── rest                                 # REST Controllers
    │   └── LeaseController.java
    ├── web                                  # Thymeleaf Web Controllers
    │   └── LeaseWebController.java
    ├── dto                                  # Request/Response DTOs
    │   ├── CreateLeaseWebRequest.java
    │   └── LeaseViewResponse.java
    └── validator                            # Presentation Validation
        └── CreateLeaseRequestValidator.java
```

**Cross-cutting packages** (shared across modules):

```
com.smartlease
├── common
│   ├── exception                           # Base exceptions (e.g., ResourceNotFoundException)
│   ├── model                               # Shared value objects (Money, Address, DateRange)
│   ├── util                                # Utility classes (DateUtils, ValidationUtils)
│   ├── annotation                          # Custom annotations (@AuthenticatedUser, @RateLimited)
│   └── config                              # Common configurations (Jackson, MessageSource, CORS)
├── security
│   ├── config                              # SecurityConfig, method-security annotations
│   ├── jwt                                 # JwtTokenProvider, JwtAuthenticationFilter
│   ├── model                               # UserPrincipal (implements UserDetails)
│   └── annotation                          # @CurrentUser, @RequirePermission
└── infrastructure
    ├── audit                               # Auditing (createdBy, createdAt, updatedBy, updatedAt)
    ├── logging                             # Structured logging filters, MDC configuration
    └── monitoring                          # Health indicators, metrics configuration
```

---

## 7. Data Flow Architecture

### 7.1 Request Flow (REST API)

```
Client
  │
  ▼
[Spring Security Filter Chain]
  │  CorsFilter → JwtAuthenticationFilter → ExceptionTranslationFilter
  │
  ▼
[DispatcherServlet]
  │
  ▼
[Controller]                    ← Presentation Layer
  │  Validates request DTO
  │  Maps to command/query
  ▼
[Use Case / Service]            ← Application Layer
  │  Orchestrates business logic
  │  Calls domain model methods
  │  Invokes port-out interfaces
  ▼
[Domain Model]                  ← Domain Layer
  │  Enforces business rules
  │  Fires domain events
  ▼
[Repository Adapter]            ← Infrastructure Layer
  │  JPA / MongoDB operations
  │  Maps between entity ↔ domain model
  ▼
[Database]
```

### 7.2 Domain Events Flow

```
Domain Entity
  │  Fires event (e.g., lease.recordSigning())
  ▼
[DomainEventPublisher]          ← Application Layer
  │  Publishes synchronously or async via ApplicationEventPublisher
  ▼
[EventHandler]
  │  LeaseSignedHandler
  │     ├── → CreateFirstInvoiceUseCase
  │     ├── → SendConfirmationNotificationUseCase
  │     └── → UpdateDashboardMetricsUseCase
```

---

## 8. Database Strategy

### 8.1 PostgreSQL — Primary (Relational) Store

Used for all transactional, consistency-critical data.

| Module | Key Tables | Notes |
|---|---|---|
| **Auth** | `users`, `roles`, `user_roles`, `refresh_tokens` | Soft-delete enabled |
| **Property** | `properties`, `units`, `property_images` | `properties.attributes` → JSONB for flexible fields |
| **Tenant** | `tenants`, `tenant_documents`, `tenant_contacts` | |
| **Lease** | `leases`, `lease_terms`, `rent_schedules`, `security_deposits` | Encrypted PII columns |
| **Rent** | `invoices`, `payments`, `payment_ledger`, `receipts` | Ledger pattern for audit |
| **Maintenance** | `tickets`, `ticket_assignments`, `vendors`, `sla_policies` | Status + FK to core entities |

**Key Design Decisions:**
- All tables have `created_at`, `updated_at`, `created_by`, `updated_by` (audit columns)
- Use `@Version` for optimistic locking on critical aggregates (Lease, Invoice)
- JSONB columns for attribute extensibility without schema migration
- Enums stored as VARCHAR with `@Enumerated(EnumType.STRING)`
- Foreign keys enforced; cascading deletes are **never** automatic (soft delete preferred)

### 8.2 MongoDB — Document (Operational) Store

Used for write-heavy, schema-flexible, or append-only data.

| Collection | Module | Purpose |
|---|---|---|
| `audit_logs` | Cross-cutting | Immutable audit trail for all entity changes |
| `ticket_comments` | Maintenance | Thread conversations (unbounded growth) |
| `notification_logs` | Auth | Delivery status for emails/SMS |
| `dashboard_snapshots` | Dashboard | Pre-computed aggregation cache |
| `session_events` | Auth | Login/logout activity stream |

### 8.3 Database Interaction Patterns

| Pattern | When to Use |
|---|---|
| **Spring Data JPA Repository** | Standard CRUD for aggregates |
| **Custom `@Query` (JPQL)** | Complex joins, aggregations, reporting |
| **EntityManager + Criteria API** | Dynamic query construction (filters, sorting) |
| **MongoTemplate** | Complex MongoDB aggregations, text search |
| **PostgreSQL Views** | Dashboard read-models (pre-joined, indexed) |

---

## 9. Security Architecture

### 9.1 Authentication & Authorization Flow

```
Login Request
  │  POST /api/v1/auth/login { email, password }
  ▼
[AuthenticationController]
  ▼
[AuthenticationService]
  │  1. Validate credentials via AuthenticationManager
  │  2. Generate Access Token (15 min expiry)
  │  3. Generate Refresh Token (7 day expiry, stored in DB)
  ▼
Response: { accessToken, refreshToken, tokenType: "Bearer" }
```

Every subsequent request:
```
Request → JwtAuthenticationFilter
  │  1. Extract "Bearer <token>" from Authorization header
  │  2. Validate token (signature, expiry, blacklist check)
  │  3. Resolve UserPrincipal from token claims
  │  4. Set SecurityContextHolder
  ▼
Request reaches Controller with authenticated principal
```

### 9.2 RBAC Model

```
Role hierarchy:          Permissions:
  ADMIN                  property:*, tenant:*, lease:*, rent:*, maintenance:*, user:*
  PROPERTY_MANAGER       property:*, tenant:*, lease:*, rent:write, maintenance:*
  TENANT                 lease:read, rent:read, payment:write, maintenance:write
  VENDOR                 maintenance:read, maintenance:update (assigned tickets only)
  VIEWER                 property:read, dashboard:read
```

**Implementation approach:**
- `@PreAuthorize("hasRole('ADMIN')")` on controller methods
- `@PreAuthorize("hasPermission(#leaseId, 'LEASE', 'WRITE')")` for resource-level permission checks via custom `PermissionEvaluator`
- Method security enabled via `@EnableMethodSecurity`

### 9.3 Password Policy

| Rule | Value |
|---|---|
| Minimum length | 12 characters |
| Complexity | At least 1 uppercase, 1 lowercase, 1 digit, 1 special character |
| Hash algorithm | BCrypt (strength = 12 rounds) |
| Max login attempts | 5 before temporary lockout (15 minutes) |
| Password history | Cannot reuse last 5 passwords |

### 9.4 Additional Security Controls

- **CSRF**: Enabled for Thymeleaf views; disabled for stateless REST API endpoints
- **CORS**: Whitelist of allowed origins (environment-configurable)
- **Rate Limiting**: Token-bucket algorithm on `/api/v1/auth/login` (10 req/min per IP)
- **Audit Logging**: All write operations logged with actor, timestamp, resource, action
- **JWT Blacklist**: Revoked tokens stored in Redis (or in-memory cache) until natural expiry

---

## 10. API Design Conventions

### 10.1 URL Structure

```
/api/v1/{module}/{resource}[/{id}][/{sub-resource}]

Examples:
  GET    /api/v1/properties                    → List all properties
  POST   /api/v1/properties                    → Create a property
  GET    /api/v1/properties/{id}               → Get property by ID
  PUT    /api/v1/properties/{id}               → Update property
  DELETE /api/v1/properties/{id}               → Soft-delete property
  GET    /api/v1/properties/{id}/units         → List units for a property
  GET    /api/v1/leases/{id}/invoices          → List invoices for a lease
```

### 10.2 Response Envelope

Standard JSON envelope for all API responses:

```json
{
  "status": "SUCCESS",
  "code": 200,
  "message": "Property retrieved successfully",
  "data": { ... },
  "errors": null,
  "timestamp": "2026-07-28T10:30:00Z",
  "path": "/api/v1/properties/123"
}
```

For paginated responses:

```json
{
  "status": "SUCCESS",
  "data": {
    "content": [ ... ],
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8,
    "sort": { "createdAt": "desc" }
  }
}
```

### 10.3 HTTP Status Code Conventions

| Code | When |
|---|---|
| `200 OK` | Successful GET, PUT, PATCH |
| `201 Created` | Successful POST |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Validation failure, malformed request |
| `401 Unauthorized` | Missing/invalid JWT |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Version conflict (optimistic locking), duplicate resource |
| `422 Unprocessable Entity` | Business rule violation (e.g., lease dates overlap) |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unhandled exception (logged with trace ID) |

### 10.4 Versioning Strategy

- URL-based versioning (`/api/v1/...`, `/api/v2/...`)
- Deprecated endpoints retained for minimum 2 release cycles
- Deprecation indicated via `Sunset` and `Deprecation` response headers

### 10.5 Validation Strategy

- `jakarta.validation` annotations on request DTOs (`@NotBlank`, `@Email`, `@Positive`, `@Future`, `@Size`)
- Custom validators for cross-field validation (e.g., `@ValidDateRange(startDate, endDate)`)
- Validation errors returned as `List<FieldError>` with field path, rejected value, and message

---

## 11. Enterprise Coding Standards

### 11.1 Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Classes (entities) | PascalCase, singular noun | `Lease`, `MaintenanceTicket` |
| Interfaces (ports) | PascalCase, `-UseCase` / `-Port` suffix | `CreateLeaseUseCase`, `PaymentGatewayPort` |
| Implementations | PascalCase, descriptive | `JpaLeaseRepository`, `StripePaymentGatewayAdapter` |
| Methods | camelCase, verb-noun | `findByPropertyId`, `calculateLateFees`, `processPayment` |
| Constants | UPPER_SNAKE_CASE | `LOCKOUT_DURATION_MINUTES` |
| Packages | lowercase, dot-separated | `com.smartlease.lease.domain.model` |

### 11.2 Code Quality Rules

- **No field injection** — always use constructor injection (final fields + Lombok `@RequiredArgsConstructor`)
- **No `@Data` on JPA entities** — use `@Getter @Setter @EqualsAndHashCode(callSuper = true)` explicitly
- **No `@Autowired`** — constructor injection only
- **DTOs are never reused across layers** — Application DTO ≠ Presentation DTO ≠ JPA Entity
- **Domain model never has JPA annotations** — keep it pure; map through infrastructure mappers
- **Methods stay under 30 lines** — extract early
- **Classes stay under 400 lines** — split if larger
- **Immutability preferred** — use `@Value` / `record` for value objects and DTOs where possible
- **No raw `Map`/`List` returns from controllers** — always use typed DTOs
- **Null safety** — `Optional` for repository returns; `Objects.requireNonNull()` for invariants

### 11.3 Exception Hierarchy

```
RuntimeException
├── SmartLeaseException (base, extends RuntimeException)
│   ├── ResourceNotFoundException
│   ├── BusinessRuleViolationException
│   │   ├── LeaseOverlapException
│   │   ├── InsufficientPaymentException
│   │   └── DuplicateTenantException
│   ├── InvalidStateTransitionException
│   └── UnauthorizedOperationException
├── AuthenticationException (Spring Security)
├── AccessDeniedException (Spring Security)
└── ConstraintViolationException (jakarta.validation)
```

### 11.4 Logging Standards

- Use **SLF4J** with parameterized logging (`log.info("Lease {} created for property {}", leaseId, propertyId)`)
- **Log levels**:
  - `ERROR` — System-level failure (DB down, external API unreachable)
  - `WARN` — Business rule violation, retryable failure
  - `INFO` — State changes (lease created, payment processed)
  - `DEBUG` — Detailed flow for troubleshooting (never in production by default)
- **MDC fields** on every log entry: `traceId`, `userId`, `tenantId`, `requestPath`
- Structured JSON logging in production for log aggregation (ELK, Datadog, etc.)

### 11.5 Transaction Management

- `@Transactional` on application service methods (use case boundary)
- Read-only transactions for queries: `@Transactional(readOnly = true)`
- Avoid `@Transactional` in controllers or repository interfaces directly
- Handle `OptimisticLockException` with retry logic (max 3 attempts)

---

## 12. Error Handling & Logging

### 12.1 Global Exception Handler

A single `@RestControllerAdvice` / `@ControllerAdvice` handles all exceptions:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(BusinessRuleViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessRule(BusinessRuleViolationException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(ApiResponse.error("BUSINESS_RULE_VIOLATION", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<List<FieldError>>> handleValidation(
            MethodArgumentNotValidException ex) {
        List<FieldError> errors = ...;
        return ResponseEntity.badRequest()
            .body(ApiResponse.error("VALIDATION_FAILED", "Input validation failed", errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Unhandled exception occurred", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}
```

### 12.2 Audit Logging (Cross-Cutting)

Every mutating operation (POST, PUT, DELETE, PATCH) is automatically logged via an AOP aspect:

| Field | Description |
|---|---|
| `traceId` | Correlates request across logs |
| `actorId` | Authenticated user who performed the action |
| `actorRole` | Role of the actor at time of action |
| `action` | `CREATE_PROPERTY`, `UPDATE_LEASE`, `DELETE_TENANT` |
| `resourceType` | `LEASE`, `PROPERTY`, `TENANT` |
| `resourceId` | Identifier of the affected resource |
| `oldValue` | Snapshot of the state before change (JSON) |
| `newValue` | Snapshot of the state after change (JSON) |
| `ipAddress` | Client IP |
| `timestamp` | When the action occurred |

Audit logs are persisted to MongoDB for immutability and fast range queries.

---

## 13. Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| **Unit Tests** | JUnit 5 + Mockito | Domain logic, value objects, specifications, use case orchestration |
| **Integration Tests** | SpringBootTest + Testcontainers | Repository implementations, full service layer with real DB |
| **API Tests** | MockMvc / WebTestClient | Controller request/response validation, security filters |
| **View Tests** | HtmlUnit / Selenium (optional) | Thymeleaf template rendering |
| **Architecture Tests** | ArchUnit | Enforce package dependency rules, naming conventions |

### Test Coverage Goals
- **Domain Layer**: ≥ 95% branch coverage
- **Application Layer**: ≥ 90% line coverage
- **Infrastructure/Presentation**: ≥ 80% line coverage

### Key Testing Conventions
- Tests follow Arrange-Act-Assert (AAA) pattern
- Use `@Nested` classes to group test cases by scenario
- Mock external dependencies (payment gateways, email services) at the port boundary
- Domain entities tested without Spring context (plain JUnit)
- Parameterized tests for boundary/edge cases

---

## 14. Build & Deployment

### 14.1 Maven Multi-Module Structure

```
smartlease/
├── pom.xml                           # Parent POM (dependency management, plugin config)
├── smartlease-common/                # Shared value objects, utilities, base exceptions
├── smartlease-security/              # JWT, authentication, authorization
├── smartlease-domain/                # Domain models, repository interfaces, events
├── smartlease-application/           # Use cases, application services, DTOs, ports
├── smartlease-infrastructure/        # Persistence, external APIs, security adapters
├── smartlease-web/                   # REST controllers, Thymeleaf controllers, views
└── smartlease-boot/                  # Spring Boot application entry point (packaging)
```

Alternative: Single-module with well-defined package boundaries (simpler start, easier refactoring later).

### 14.2 Key Maven Plugins

| Plugin | Purpose |
|---|---|
| `spring-boot-maven-plugin` | Build executable JAR |
| `maven-compiler-plugin` | Java 17, annotation processors (Lombok + MapStruct) |
| `maven-surefire-plugin` | Unit test execution |
| `maven-failsafe-plugin` | Integration test execution (`*IT.java`) |
| `jacoco-maven-plugin` | Code coverage reporting |
| `spotbugs-maven-plugin` | Static analysis for bug patterns |
| `spotless-maven-plugin` | Code formatting enforcement |

### 14.3 Environment Profiles

| Profile | Database | Logging | Features |
|---|---|---|---|
| `local` | H2 in-memory (PostgreSQL mode) | Console DEBUG | Dev tools enabled |
| `dev` | Local PostgreSQL + MongoDB | Console INFO | Detailed error messages |
| `staging` | Cloud PostgreSQL + MongoDB | File JSON INFO | Full security, no dev tools |
| `prod` | Cloud PostgreSQL + MongoDB | JSON ELK INFO | Production hardening, rate limits |

### 14.4 Application Properties Structure

```
src/main/resources/
├── application.yml                   # Common configuration
├── application-local.yml             # Local overrides
├── application-dev.yml               # Development overrides
├── application-staging.yml           # Staging overrides
└── application-prod.yml              # Production overrides
```

---

## 15. Project Directory Layout

```
smartlease/
│
├── pom.xml
│
├── src/
│   ├── main/
│   │   ├── java/com/smartlease/
│   │   │   ├── SmartLeaseApplication.java
│   │   │   │
│   │   │   ├── common/                           # Cross-cutting
│   │   │   │   ├── exception/
│   │   │   │   ├── model/
│   │   │   │   ├── util/
│   │   │   │   ├── annotation/
│   │   │   │   └── config/
│   │   │   │
│   │   │   ├── security/                         # Security framework
│   │   │   │   ├── config/
│   │   │   │   ├── jwt/
│   │   │   │   ├── model/
│   │   │   │   └── annotation/
│   │   │   │
│   │   │   ├── auth/                             # Module: Authentication
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   ├── infrastructure/
│   │   │   │   └── presentation/
│   │   │   │
│   │   │   ├── property/                         # Module: Property Management
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   ├── infrastructure/
│   │   │   │   └── presentation/
│   │   │   │
│   │   │   ├── tenant/                           # Module: Tenant Management
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   ├── infrastructure/
│   │   │   │   └── presentation/
│   │   │   │
│   │   │   ├── lease/                            # Module: Lease Management
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   ├── infrastructure/
│   │   │   │   └── presentation/
│   │   │   │
│   │   │   ├── rent/                             # Module: Rent Collection
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   ├── infrastructure/
│   │   │   │   └── presentation/
│   │   │   │
│   │   │   ├── maintenance/                      # Module: Maintenance Tickets
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   ├── infrastructure/
│   │   │   │   └── presentation/
│   │   │   │
│   │   │   └── dashboard/                        # Module: Dashboard
│   │   │       ├── application/
│   │   │       └── presentation/
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-local.yml
│   │       ├── application-dev.yml
│   │       ├── application-staging.yml
│   │       ├── application-prod.yml
│   │       ├── messages.properties
│   │       └── templates/                        # Thymeleaf templates
│   │           ├── layouts/
│   │           │   ├── default.html
│   │           │   └── auth.html
│   │           ├── fragments/
│   │           │   ├── header.html
│   │           │   ├── footer.html
│   │           │   ├── sidebar.html
│   │           │   └── alerts.html
│   │           ├── auth/
│   │           │   ├── login.html
│   │           │   └── register.html
│   │           ├── property/
│   │           │   ├── list.html
│   │           │   ├── detail.html
│   │           │   └── form.html
│   │           ├── tenant/
│   │           │   ├── list.html
│   │           │   ├── detail.html
│   │           │   └── form.html
│   │           ├── lease/
│   │           │   ├── list.html
│   │           │   ├── detail.html
│   │           │   └── form.html
│   │           ├── rent/
│   │           │   ├── invoices.html
│   │           │   ├── payments.html
│   │           │   └── receipt.html
│   │           ├── maintenance/
│   │           │   ├── list.html
│   │           │   ├── detail.html
│   │           │   └── form.html
│   │           ├── dashboard/
│   │           │   ├── index.html
│   │           │   └── reports.html
│   │           └── error/
│   │               ├── 404.html
│   │               ├── 500.html
│   │               └── access-denied.html
│   │
│   └── test/
│       └── java/com/smartlease/
│           ├── common/
│           ├── security/
│           ├── auth/
│           ├── property/
│           ├── tenant/
│           ├── lease/
│           ├── rent/
│           ├── maintenance/
│           └── dashboard/
│
├── db/
│   ├── postgres/
│   │   ├── migrations/                          # Flyway migration scripts
│   │   │   ├── V1__init_schema.sql
│   │   │   ├── V2__seed_roles.sql
│   │   │   └── ...
│   │   └── seed/
│   │       └── demo_data.sql
│   └── mongodb/
│       └── seed/
│           └── demo_audit_logs.json
│
├── docker-compose.yml                            # Local PostgreSQL + MongoDB + App
├── Dockerfile                                    # Multi-stage build
├── .env.example
├── .gitignore
└── README.md
```

---

## Appendix A: Key Architectural Decisions (ADRs)

| ADR | Decision | Rationale |
|---|---|---|
| **001** | Use dual DB (PostgreSQL + MongoDB) | Relational for transactional data with strong consistency; document for append-heavy, schema-flexible workloads |
| **002** | Single-module Maven project with strict package boundaries | Faster iteration for a team of 3-5 devs; extract to multi-module when module compilation independence is needed |
| **003** | Thymeleaf instead of SPA for UI | Simpler to build and secure; SSR with Bootstrap is sufficient for an internal tool; no CORS/OAuth complexity for views |
| **004** | Soft-delete for core entities | Audit requirements and data recovery; flagged via `deleted_at` timestamp column |
| **005** | Separate domain model from JPA entities | Prevents JPA coupling to business logic; allows rich domain model without persistence concerns |
| **006** | JWT over session-based auth | Stateless scaling; no session store required; fine-grained claims for RBAC |

---

## Appendix B: Glossary

| Term | Definition |
|---|---|
| **Property** | A building or complex containing one or more rental units |
| **Unit** | An individual rentable space within a property (apartment, office, etc.) |
| **Tenant** | A person or entity that rents a unit under a lease agreement |
| **Lease** | A legally binding contract between property owner/manager and tenant |
| **Rent Schedule** | Defines base rent, escalation clauses, discounts, and payment frequency |
| **Security Deposit** | Refundable amount held against damages or unpaid rent |
| **Invoice** | A periodic billing document generated from the rent schedule |
| **DELINQUENT** | An invoice past its due date with outstanding balance |
| **Maintenance Ticket** | A request for repair or service, assigned to a vendor or internal staff |
| **Aggregate Root** | A DDD concept — the root entity that guarantees consistency of a cluster of objects |

---

> *This document serves as the single source of truth for SmartLease architecture decisions.  
> All contributors are expected to read and adhere to these conventions before writing code.*
