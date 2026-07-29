# SmartLease — Architecture Document

> **Technical Architecture Blueprint**  
> *Version 1.0* | *Last Updated: July 28, 2026*

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Package Structure](#2-package-structure)
3. [Layered Architecture](#3-layered-architecture)
4. [Module Interaction Map](#4-module-interaction-map)
5. [Authentication Flow](#5-authentication-flow)
6. [Database Interaction](#6-database-interaction)
7. [Security Flow](#7-security-flow)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Architecture Decision Records (ADRs)](#9-architecture-decision-records-adrs)

---

## 1. High-Level Architecture

### 1.1 System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SmartLease System                                 │
│                                                                              │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│   │  Auth    │   │ Property │   │  Tenant  │   │  Lease   │   │   Rent   │  │
│   │ Module   │   │ Mgmt     │   │  Mgmt    │   │  Mgmt    │   │Collectn  │  │
│   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘  │
│        │              │              │              │              │         │
│   ┌────┴─────┐   ┌────┴─────┐   ┌────┴─────┐                        │       │
│   │Maintenanc│   │Dashboard │   │  Common   │◄───────────────────────┘       │
│   │ Tickets  │   │ Module   │   │Cross-Cutng│                                │
│   └──────────┘   └──────────┘   └──────────┘                                 │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐   │
│   │                    Infrastructure Layer                                │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│   │  │PostgreSQL│  │ MongoDB  │  │  Flyway  │  │ Logback  │              │   │
│   │  │   16     │  │    7     │  │Migrations│  │+ SLF4J   │              │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │   │
│   └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
         ▲                            ▲                           ▲
         │                            │                           │
   ┌─────┴─────┐               ┌──────┴──────┐           ┌───────┴───────┐
   │  Browser  │               │   REST API   │           │   External    │
   │(Thymeleaf)│               │   Clients    │           │  Services     │
   └───────────┘               └──────────────┘           │ (Email, SMS,  │
                                                          │  Payment GW)  │
                                                          └───────────────┘
```

### 1.2 Container Diagram

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           SmartLease Application                                │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         Spring Boot Container                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ REST API     │  │ Thymeleaf    │  │  WebSocket   │  │  Scheduled   │  │   │
│  │  │ Controllers  │  │ Controllers  │  │  Handlers    │  │  Tasks       │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │   │
│  │         │                 │                  │                │           │   │
│  │         └─────────────────┴──────────────────┴────────────────┘           │   │
│  │                              │                                             │   │
│  │                    ┌─────────▼──────────┐                                   │   │
│  │                    │  Application Layer   │                                   │   │
│  │                    │  (Use Cases, Ports)  │                                   │   │
│  │                    └─────────┬──────────┘                                   │   │
│  │                              │                                             │   │
│  │                    ┌─────────▼──────────┐                                   │   │
│  │                    │    Domain Layer      │                                   │   │
│  │                    │  (Entities, Events)  │                                   │   │
│  │                    └─────────┬──────────┘                                   │   │
│  │                              │                                             │   │
│  │                    ┌─────────▼──────────┐                                   │   │
│  │                    │  Infrastructure     │                                   │   │
│  │                    │  (Persistence, JWT, │                                   │   │
│  │                    │   Email, etc.)      │                                   │   │
│  │                    └─────────┬──────────┘                                   │   │
│  └──────────────────────────────┼────────────────────────────────────────────┘   │
│                                 │                                                  │
│  ┌──────────────────────────────┼────────────────────────────────────────────┐   │
│  │                    ┌─────────▼──────────┐                                   │   │
│  │                    │  Connection Pools    │                                   │   │
│  │                    └─────────┬──────────┘                                   │   │
│  └──────────────────────────────┼────────────────────────────────────────────┘   │
└─────────────────────────────────┼────────────────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
    ┌─────▼─────┐          ┌──────▼──────┐          ┌─────▼─────┐
    │ PostgreSQL │          │   MongoDB   │          │    SMTP    │
    │    (16)    │          │     (7)     │          │   Server   │
    └───────────┘          └─────────────┘          └───────────┘
```

### 1.3 Request Flow — End-to-End

```
┌──────┐     ┌──────────────┐     ┌────────────────┐     ┌──────────────┐     ┌───────────┐
│Client│ ──► │Spring Sec    │ ──► │  Dispatcher    │ ──► │   Controller │ ──► │ Use Case   │
│      │ ◄── │Filter Chain   │ ◄── │  Servlet       │ ◄── │   (REST/WEB) │ ◄── │  Service   │
└──────┘     └──────────────┘     └────────────────┘     └──────────────┘     └─────┬─────┘
                                                                                     │
                                                                              ┌──────▼──────┐
                                                                              │   Domain    │
                                                                              │   Model     │
                                                                              └──────┬──────┘
                                                                                     │
                                                                              ┌──────▼──────┐
                                                                              │ Repository  │
                                                                              │   Adapter   │
                                                                              └──────┬──────┘
                                                                                     │
                                                                            ┌────────┴────────┐
                                                                            │                 │
                                                                      ┌─────▼─────┐   ┌─────▼─────┐
                                                                      │PostgreSQL │   │  MongoDB  │
                                                                      └───────────┘   └───────────┘

Request Flow Steps:
1. Client sends HTTP request (Browser/API Client)
2. Spring Security Filter Chain intercepts: CORS → JWT Auth → Exception Translation
3. DispatcherServlet routes to appropriate Controller
4. Controller validates input DTO, maps to command/query
5. Use Case Service orchestrates business logic
6. Domain Model enforces business rules, fires domain events
7. Repository Adapter persists/retrieves data via JPA or MongoDB driver
8. Response flows back through the same layers (in reverse)
```

---

## 2. Package Structure

### 2.1 Module Package Architecture

Each module follows the **strict package-by-layer** convention:

```
com.smartlease
│
├── ${module}
│   ├── domain                              # ZERO external dependencies
│   │   ├── model/
│   │   │   ├── entity/                     # Domain entities (e.g., Lease.java)
│   │   │   └── valueobject/                # Value objects (e.g., Money.java, DateRange.java)
│   │   ├── event/                          # Domain events
│   │   ├── repository/                     # Repository interfaces (pure contracts)
│   │   ├── spec/                           # Business specifications
│   │   └── exception/                      # Domain exceptions
│   │
│   ├── application                         # Depends ONLY on domain
│   │   ├── port/
│   │   │   ├── in/                         # Inbound ports (use case interfaces)
│   │   │   └── out/                        # Outbound ports (gateway interfaces)
│   │   ├── service/                        # Use case implementations
│   │   ├── dto/                            # Application DTOs (request/response)
│   │   └── mapper/                         # DTO ↔ Domain mappers
│   │
│   ├── infrastructure                      # Implements domain + application interfaces
│   │   ├── persistence/
│   │   │   ├── entity/                     # JPA entities (not domain entities!)
│   │   │   ├── repository/                 # Spring Data JPA repositories
│   │   │   └── mapper/                     # JPA entity ↔ Domain entity mappers
│   │   ├── security/                       # Security adapters (JWT providers, etc.)
│   │   ├── client/                         # External API clients
│   │   └── config/                         # Module-specific Spring configuration
│   │
│   └── presentation                        # Depends on application layer
│       ├── rest/                           # REST controllers
│       ├── web/                            # Thymeleaf controllers
│       ├── dto/                            # Presentation DTOs (request/response validation)
│       └── validator/                      # Custom validation logic
```

### 2.2 Cross-Cutting Packages

```
com.smartlease
├── common/                                 # Shared across all modules
│   ├── exception/                          # Base exception classes
│   │   ├── SmartLeaseException.java
│   │   ├── ResourceNotFoundException.java
│   │   └── BusinessRuleViolationException.java
│   ├── model/                              # Shared value objects
│   │   ├── Money.java
│   │   ├── Address.java
│   │   └── DateRange.java
│   ├── util/                               # Utility classes
│   │   ├── DateUtils.java
│   │   └── ValidationUtils.java
│   ├── annotation/                         # Custom annotations
│   │   ├── @AuthenticatedUser.java
│   │   └── @RateLimited.java
│   └── config/                             # Common configuration
│       ├── JacksonConfig.java
│       ├── MessageSourceConfig.java
│       └── CorsConfig.java
│
├── security/                               # Security framework
│   ├── config/
│   │   ├── SecurityConfig.java             # Spring Security configuration
│   │   └── MethodSecurityConfig.java       # @EnableMethodSecurity
│   ├── jwt/
│   │   ├── JwtTokenProvider.java           # JWT creation & validation
│   │   ├── JwtAuthenticationFilter.java    # OncePerRequestFilter
│   │   └── JwtAuthenticationEntryPoint.java
│   ├── model/
│   │   └── UserPrincipal.java              # Implements UserDetails
│   └── annotation/
│       ├── @CurrentUser.java               # Parameter resolver
│       └── @RequirePermission.java
│
└── infrastructure/                         # Cross-cutting infrastructure
    ├── audit/
    │   └── AuditAspect.java                # AOP audit logging
    ├── logging/
    │   └── MdcFilter.java                  # MDC population filter
    └── monitoring/
        ├── HealthIndicator.java
        └── MetricsConfig.java
```

### 2.3 Dependency Graph

```
┌────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                           │
│  ┌────────────┐    ┌────────────┐    ┌──────────────────┐      │
│  │REST Ctrl   │    │Web Ctrl    │    │GlobalException-   │      │
│  │(@RestCtrl) │    │(@Controller)│    │Handler(@Advice)  │      │
│  └─────┬──────┘    └─────┬──────┘    └────────┬─────────┘      │
│        │                 │                     │                │
│        └─────────────────┼─────────────────────┘                │
│                          │ DEPENDS ON                           │
├──────────────────────────┼─────────────────────────────────────┤
│                    Application Layer                            │
│  ┌────────────┐    ┌─────┴──────┐    ┌──────────────────┐      │
│  │ Ports (In) │◄───│ Use Cases  │───►│  Ports (Out)     │      │
│  │ Interfaces │    │ (Services) │    │  Interfaces      │      │
│  └────────────┘    └─────┬──────┘    └──────────────────┘      │
│                          │ DEPENDS ON                           │
├──────────────────────────┼─────────────────────────────────────┤
│                    Domain Layer                                 │
│  ┌────────────┐    ┌─────┴──────┐    ┌──────────────────┐      │
│  │  Entities  │    │  Value Objs │    │ Repository (int) │      │
│  │  + Events  │    │  + Specs   │    │ Domain Events    │      │
│  └────────────┘    └────────────┘    └──────────────────┘      │
│  (PURE JAVA — NO FRAMEWORK DEPENDENCIES)                        │
├────────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                         │
│  ┌────────────┐    ┌────────────┐    ┌──────────────────┐      │
│  │JPA Adapter │    │Mongo Adptr│    │  JWT Provider    │      │
│  │(implements)│    │(implements)│    │  Security Filter │      │
│  └────────────┘    └────────────┘    └──────────────────┘      │
│  DEPENDS ON: Spring Boot, Hibernate, MongoDB Driver, jjwt      │
└────────────────────────────────────────────────────────────────┘

Arrow direction: ◄── depends on
Dependency Rule: Outer layers depend on inner layers. NEVER the reverse.
```

---

## 3. Layered Architecture

### 3.1 Layer Responsibilities & Rules

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ LAYER                    RESPONSIBILITY                    ALLOWED DEPENDENCIES │
├───────────────────────────────────────────────────────────────────────────────┤
│ PRESENTATION  • HTTP request/response handling           Application Layer     │
│               • Input validation (javax.validation)      Spring Framework       │
│               • DTO ↔ Command/Query mapping              Thymeleaf (views)      │
│               • View rendering (Thymeleaf)               Bootstrap (static)     │
│               • Exception → User-friendly error          Jakarta Validation     │
│                                                                                 │
│ APPLICATION   • Use case orchestration                   Domain Layer           │
│               • Transaction management                   Spring (DI, TX)        │
│               • Authorization checks                     DTOs (self-contained)  │
│               • Event publishing                         MapStruct (mapping)    │
│               • No business rules — delegate to domain                         │
│                                                                                 │
│ DOMAIN        • Business rules & invariants              NONE (pure Java)      │
│               • Entity behaviour (methods)               JDK only              │
│               • Value object immutability                Lombok (optional)     │
│               • Domain events                            No Spring/JPA/Hibernate│
│               • Repository interfaces (contracts)                               │
│               • No framework annotations                                        │
│                                                                                 │
│ INFRASTRUCT   • Persistence (JPA / MongoDB)              Spring Boot            │
│               • Security (JWT, BCrypt, CORS)             Hibernate/JPA          │
│               • External API adapters                    Spring Data            │
│               • Configuration beans                      MongoDB Driver          │
│               • Audit logging (AOP)                      jjwt library           │
│               • Email/SMS notifications                  Lombok, MapStruct      │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Key Layer Enforcement Rules (ArchUnit)

```
Rule 1: Domain layer MUST NOT depend on any Spring framework class
Rule 2: Domain layer MUST NOT depend on any JPA/Hibernate annotation
Rule 3: Application layer MUST NOT depend on Presentation layer
Rule 4: Application layer MUST NOT depend on Infrastructure layer
Rule 5: Infrastructure layer MAY depend on Domain and Application layers
Rule 6: Presentation layer MUST NOT depend on Infrastructure layer directly
Rule 7: No cycles between packages
Rule 8: All public methods in Application layer MUST be @Transactional
```

### 3.3 Package Sensitivity & Change Impact

```
HIGH SENSITIVITY (changes require coordination):
  • Domain entities & value objects
  • Repository interfaces (contract changes)
  • Application ports (use case interfaces)

MEDIUM SENSITIVITY (changes may ripple):
  • Application DTOs
  • JPA entity ↔ Domain entity mappers
  • Security configuration

LOW SENSITIVITY (localized changes):
  • Controller implementations (add endpoints)
  • Repository implementations (optimize queries)
  • View templates (UI changes)
  • Configuration properties
```

---

## 4. Module Interaction Map

### 4.1 Module Dependency Graph

```
                    ┌──────────────┐
                    │   AUTH       │
                    │  Module      │
                    └──────┬───────┘
                           │ All modules depend on auth for security context
         ┌─────────────────┼──────────────────┐
         │                 │                   │
         ▼                 ▼                   ▼
  ┌────────────┐   ┌────────────┐   ┌──────────────┐
  │ PROPERTY   │   │  TENANT    │   │ MAINTENANCE  │
  │ Module     │   │  Module    │   │   Module     │
  └──────┬─────┘   └──────┬─────┘   └──────┬───────┘
         │                 │                │
         │         ┌───────┴────────┐       │
         │         │                │       │
         ▼         ▼                ▼       │
  ┌─────────────────────────────┐           │
  │        LEASE Module         │◄──────────┘
  │  (aggregates property-      │
  │   tenant-unit relationships)│
  └──────────────┬──────────────┘
                 │
                 ▼
  ┌─────────────────────────────┐
  │        RENT Module          │
  │  (consumes lease for        │
  │   invoice generation)       │
  └──────────────┬──────────────┘
                 │
                 ▼
  ┌─────────────────────────────┐
  │      DASHBOARD Module       │
  │  (reads from ALL modules    │
  │   for aggregate KPIs)       │
  └─────────────────────────────┘
```

### 4.2 Cross-Module Data Flow

```
                    PROPERTY MODULE               TENANT MODULE
                    ┌─────────────────┐           ┌─────────────────┐
                    │ Property{id,    │           │ Tenant{id,      │
                    │  name, address, │           │  name, email,   │
                    │  type, units[]} │           │  phone, docs[]} │
                    └────────┬────────┘           └────────┬────────┘
                             │                            │
                             ▼                            ▼
                    ┌───────────────────────────────────────────────┐
                    │              LEASE MODULE                     │
                    │  Lease{id, propertyId, unitId, tenantId,      │
                    │         startDate, endDate, rentSchedule,     │
                    │         depositAmount, status, terms}         │
                    └──────────────────────┬────────────────────────┘
                                           │
                                           ▼
                    ┌───────────────────────────────────────────────┐
                    │              RENT MODULE                      │
                    │  Invoice{id, leaseId, amount, dueDate,        │
                    │          status, lateFee, payments[]}         │
                    │  Payment{id, invoiceId, amount, method,       │
                    │          reference, timestamp}                │
                    └──────────────────────┬────────────────────────┘
                                           │
                    ┌──────────────────────┴────────────────────────┐
                    │              DASHBOARD MODULE                 │
                    │  Reads from:                                  │
                    │  • Property → unit count, status distribution │
                    │  • Tenant → active tenant count              │
                    │  • Lease → expiring leases, occupancy rate    │
                    │  • Rent → collection rate, delinquency        │
                    │  • Maintenance → open tickets, SLA breaches   │
                    └───────────────────────────────────────────────┘

                    MAINTENANCE MODULE (semi-independent)
                    ┌───────────────────────────────────────────────┐
                    │  Ticket{id, unitId, reporterId(tenant),       │
                    │         assigneeId(vendor), priority,         │
                    │         status, slaDeadline, comments[]}      │
                    │  Reads: Unit info from Property module        │
                    │  Reads: Tenant info from Tenant module [sic]  │
                    └───────────────────────────────────────────────┘
```

### 4.3 Domain Events & Side Effects

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Domain Event Bus                                 │
│  (Spring ApplicationEventPublisher)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  LeaseSignedEvent ─────────────────────────────────────────────────  │
│  ├──► CreateFirstInvoiceHandler         → Rent Module               │
│  ├──► SendLeaseConfirmationHandler      → Notification Service      │
│  └──► UpdateOccupancyMetricsHandler     → Dashboard Module          │
│                                                                      │
│  RentPaidEvent ────────────────────────────────────────────────────  │
│  ├──► UpdateInvoiceStatusHandler        → Rent Module               │
│  ├──► GenerateReceiptHandler            → Rent Module               │
│  └──► UpdateDelinquencyMetricsHandler   → Dashboard Module          │
│                                                                      │
│  LeaseExpiredEvent ────────────────────────────────────────────────  │
│  ├──► UpdateUnitStatusHandler           → Property Module           │
│  ├──► SendRenewalReminderHandler        → Notification Service      │
│  └──► UpdateOccupancyMetricsHandler     → Dashboard Module          │
│                                                                      │
│  TicketResolvedEvent ─────────────────────────────────────────────  │
│  ├──► NotifyReporterHandler             → Notification Service      │
│  ├──► UpdateSlaMetricsHandler           → Dashboard Module          │
│  └──► ScheduleFollowUpHandler           → Maintenance Module        │
│                                                                      │
│  PaymentOverdueEvent ──────────────────────────────────────────────  │
│  ├──► ApplyLateFeeHandler               → Rent Module               │
│  ├──► SendPaymentReminderHandler        → Notification Service      │
│  ├──► EscalateToManagerHandler          → Notification Service      │
│  └──► UpdateDelinquencyMetricsHandler   → Dashboard Module          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Authentication Flow

### 5.1 Registration Flow

```
┌──────┐      ┌──────────────┐      ┌───────────────┐      ┌────────────┐      ┌──────────┐
│Client│      │ AuthController│      │RegisterUseCase│      │UserRepositor│      │PostgreSQL│
└──┬───┘      └──────┬───────┘      └───────┬───────┘      └─────┬──────┘      └────┬─────┘
   │                 │                       │                    │                   │
   │  POST /register │                       │                    │                   │
   │  {email,pass,   │                       │                    │                   │
   │   name,role}    │                       │                    │                   │
   │────────────────►│                       │                    │                   │
   │                 │                       │                    │                   │
   │                 │  Validate input,      │                    │                   │
   │                 │  map to command       │                    │                   │
   │                 │──────────────────────►│                    │                   │
   │                 │                       │                    │                   │
   │                 │                       │  Validate password │                   │
   │                 │                       │  policy (≥12 chars,│                   │
   │                 │                       │  mixed case, etc)  │                   │
   │                 │                       │  Check email unique │                   │
   │                 │                       │───────────────────►│                   │
   │                 │                       │                    │                   │
   │                 │                       │                    │  SELECT COUNT(*)  │
   │                 │                       │                    │  WHERE email=?    │
   │                 │                       │                    │─────────────────►│
   │                 │                       │                    │◄─────────────────│
   │                 │                       │                    │  count = 0        │
   │                 │                       │                    │                   │
   │                 │                       │  Hash password     │                   │
   │                 │                       │  with BCrypt(12)   │                   │
   │                 │                       │  Create User entity │                   │
   │                 │                       │  Assign default role│                   │
   │                 │                       │───────────────────►│                   │
   │                 │                       │                    │                   │
   │                 │                       │                    │  INSERT INTO users │
   │                 │                       │                    │─────────────────►│
   │                 │                       │                    │◄─────────────────│
   │                 │                       │                    │                   │
   │                 │                       │  Return User       │                   │
   │                 │                       │◄───────────────────│                   │
   │                 │                       │                    │                   │
   │                 │  Map to response DTO  │                    │                   │
   │                 │◄──────────────────────│                    │                   │
   │                 │                       │                    │                   │
   │ 201 Created     │                       │                    │                   │
   │ {userId, email} │                       │                    │                   │
   │◄────────────────│                       │                    │                   │
   │                 │                       │                    │                   │
```

### 5.2 Login & JWT Issuance Flow

```
┌──────┐      ┌──────────────┐      ┌───────────────┐      ┌───────────────┐      ┌──────────┐
│Client│      │ AuthController│      │AuthService    │      │JwtTokenProvdr │      │PostgreSQL│
└──┬───┘      └──────┬───────┘      └───────┬───────┘      └───────┬───────┘      └────┬─────┘
   │                 │                       │                    │                   │
   │  POST /login    │                       │                    │                   │
   │  {email,pass}   │                       │                    │                   │
   │────────────────►│                       │                    │                   │
   │                 │                       │                    │                   │
   │                 │  Validate input       │                    │                   │
   │                 │──────────────────────►│                    │                   │
   │                 │                       │                    │                   │
   │                 │                       │  1. Load user by   │                   │
   │                 │                       │     email          │                   │
   │                 │                       │──────────────────────────────────────►│
   │                 │                       │                    │                   │
   │                 │                       │  ◄─── User{id,     │                   │
   │                 │                       │        email,      │                   │
   │                 │                       │        password    │                   │
   │                 │                       │        (hashed),   │                   │
   │                 │                       │        role,       │                   │
   │                 │                       │        lockedUntil}│                   │
   │                 │                       │                    │                   │
   │                 │                       │  2. Check account  │                   │
   │                 │                       │     locked?        │                   │
   │                 │                       │  3. Verify password │                   │
   │                 │                       │     (BCrypt.matches)│                   │
   │                 │                       │  4. Reset failed   │                   │
   │                 │                       │     attempts on OK │                   │
   │                 │                       │                    │                   │
   │                 │                       │  5. Request JWT    │                   │
   │                 │                       │──────────────────►│                   │
   │                 │                       │                    │                   │
   │                 │                       │  Create AccessToken│                   │
   │                 │                       │  (sub=userId,      │                   │
   │                 │                       │   role, iat, exp=  │                   │
   │                 │                       │   now+15min)       │                   │
   │                 │                       │                    │                   │
   │                 │                       │  Create RefreshTkn │                   │
   │                 │                       │  (UUID, exp=       │                   │
   │                 │                       │   now+7days)       │                   │
   │                 │                       │◄──────────────────│                   │
   │                 │                       │                    │                   │
   │                 │                       │  6. Store refresh  │                   │
   │                 │                       │     token in DB    │                   │
   │                 │                       │──────────────────────────────────────►│
   │                 │                       │                    │                   │
   │                 │                       │◄───────────────────│                   │
   │                 │                       │                    │                   │
   │                 │◄──────────────────────│                    │                   │
   │                 │                       │                    │                   │
   │  200 OK         │                       │                    │                   │
   │  {accessToken,  │                       │                    │                   │
   │   refreshToken, │                       │                    │                   │
   │   tokenType:    │                       │                    │                   │
   │   "Bearer"}     │                       │                    │                   │
   │◄────────────────│                       │                    │                   │
   │                 │                       │                    │                   │
```

### 5.3 Authenticated Request Flow

```
┌──────┐     ┌────────────┐     ┌──────────────┐     ┌────────────────┐     ┌─────────┐
│Client│     │JwtAuthFilter│     │SecurityContex│     │   Controller   │     │Use Case │
│      │     │ (OncePerReq)│     │   tHolder    │     │                │     │         │
└──┬───┘     └─────┬──────┘     └──────┬───────┘     └───────┬────────┘     └────┬────┘
   │                │                   │                     │                   │
   │  GET /api/v1/  │                   │                     │                   │
   │  properties    │                   │                     │                   │
   │  Authorization:│                   │                     │                   │
   │  Bearer eyJ... │                   │                     │                   │
   │───────────────►│                   │                     │                   │
   │                │                   │                     │                   │
   │                │  1. Extract       │                     │                   │
   │                │     "Bearer eyJ..."                     │                   │
   │                │                   │                     │                   │
   │                │  2. Validate JWT  │                     │                   │
   │                │     • Signature   │                     │                   │
   │                │     • Expiry      │                     │                   │
   │                │     • Blacklist   │                     │                   │
   │                │                   │                     │                   │
   │                │  3. Parse claims  │                     │                   │
   │                │     (userId, role)│                     │                   │
   │                │                   │                     │                   │
   │                │  4. Create        │                     │                   │
   │                │     UsernamePass- │                     │                   │
   │                │     wordAuthToken │                     │                   │
   │                │──────────────────►│                     │                   │
   │                │                   │                     │                   │
   │                │                   │  5. Set Security    │                   │
   │                │                   │     ContextHolder   │                   │
   │                │                   │     .setContext(auth)│                  │
   │                │                   │                     │                   │
   │                │ 6. Continue filter│                     │                   │
   │                │    chain          │                     │                   │
   │                │───────────────────────────────────────►│                   │
   │                │                   │                     │                   │
   │                │                   │                     │  7. @PreAuthorize │
   │                │                   │                     │     ("hasRole(...)")│
   │                │                   │                     │────────────────►│
   │                │                   │                     │  (authorized)    │
   │                │                   │                     │◄────────────────│
   │                │                   │                     │                   │
   │                │                   │                     │  Process request  │
   │                │                   │                     │  @CurrentUser     │
   │                │                   │                     │  UserPrincipal    │
   │                │                   │                     │                   │
   │◄───────────────│───────────────────│─────────────────────│                   │
   │                │                   │                     │                   │
   │ Response       │                   │                     │                   │
   │                │                   │                     │                   │
   │                │  8. Cleanup       │                     │                   │
   │                │     SecurityContex│                     │                   │
   │                │     tHolder.clear()                     │                   │
```

### 5.4 Token Refresh Flow

```
┌──────┐      ┌──────────────┐      ┌───────────────┐      ┌──────────┐
│Client│      │ AuthController│      │AuthService    │      │PostgreSQL│
└──┬───┘      └──────┬───────┘      └───────┬───────┘      └────┬─────┘
   │                 │                       │                   │
   │  POST /refresh  │                       │                   │
   │  {refreshToken  │                       │                   │
   │   : "uuid-xxx"} │                       │                   │
   │────────────────►│                       │                   │
   │                 │                       │                   │
   │                 │  Validate request      │                   │
   │                 │──────────────────────►│                   │
   │                 │                       │                   │
   │                 │                       │  1. Look up       │
   │                 │                       │     refresh token  │
   │                 │                       │──────────────────►│
   │                 │                       │                   │
   │                 │                       │◄── {token,        │
   │                 │                       │     userId,        │
   │                 │                       │     expiresAt,     │
   │                 │                       │     revoked}      │
   │                 │                       │                   │
   │                 │                       │  2. Validate:     │
   │                 │                       │     • Exists?     │
   │                 │                       │     • Not revoked? │
   │                 │                       │     • Not expired? │
   │                 │                       │                   │
   │                 │                       │  3. Revoke old    │
   │                 │                       │     refresh token  │
   │                 │                       │──────────────────►│
   │                 │                       │                   │
   │                 │                       │  4. Generate new  │
   │                 │                       │     access token  │
   │                 │                       │  5. Generate new  │
   │                 │                       │     refresh token  │
   │                 │                       │  6. Store new     │
   │                 │                       │──────────────────►│
   │                 │                       │                   │
   │                 │◄──────────────────────│                   │
   │                 │                       │                   │
   │  200 OK         │                       │                   │
   │  {accessToken,  │                       │                   │
   │   refreshToken} │                       │                   │
   │◄────────────────│                       │                   │
   │                 │                       │                   │
```

---

## 6. Database Interaction

### 6.1 Database Mapping Strategy

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        DATABASE MAPPING STRATEGY                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  PostgreSQL (Relational)          MongoDB (Document)                      │
│  ──────────────────────           ──────────────────                      │
│  • ACID transactions              • No transactions (eventual consistency)│
│  • Strong schema enforcement      • Schema-flexible (dynamic docs)        │
│  • Complex joins & aggregations   • Embedded documents (comments, logs)   │
│  • Foreign key integrity          • No referential integrity              │
│  • Optimistic locking (@Version)  • TTL indexes for auto-expiry          │
│                                                                           │
│  JPA + Hibernate (ORM)            Spring Data MongoDB (ODM)              │
│  ──────────────────────           ───────────────────────                 │
│  • EntityManager / @Repository    • MongoTemplate / @Repository           │
│  • JPQL for complex queries       • QueryDSL for dynamic queries          │
│  • Criteria API for dynamic query • Aggregation pipeline for reporting    │
│  • Flyway for schema migrations   • MongoTemplate for aggregations        │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Entity ↔ Database Mapping Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│          DOMAIN MODEL (Pure Java)         │     JPA ENTITY (Hibernate)       │
│                                           │                                  │
│   com.smartlease.lease.domain.model       │  com.smartlease.lease.infrastr.  │
│                                           │       .persistence.entity        │
│   ┌─────────────────────────────────┐     │  ┌──────────────────────────┐   │
│   │  Lease                           │     │  │  LeaseJpaEntity          │   │
│   │  ────────────────────────        │     │  │  ─────────────────       │   │
│   │  - leaseId: LeaseId              │◄────│  │  - id: Long (PK)         │   │
│   │  - tenantId: TenantId            │──┐  │  │  - tenantId: Long        │   │
│   │  - unitId: UnitId                │  │  │  │  - unitId: Long          │   │
│   │  - dateRange: DateRange          │  │  │  │  - startDate: LocalDate  │   │
│   │  - rentSchedule: RentSchedule    │  │  │  │  - endDate: LocalDate    │   │
│   │  - securityDeposit: Money        │  │  │  │  - baseRent: BigDecimal   │   │
│   │  - status: LeaseStatus           │  │  │  │  - escalationPct: BigDecimal│
│   │                                   │  │  │  - depositAmount: BigDecimal│   │
│   │  BEHAVIOUR:                      │  │  │  - status: String           │   │
│   │  + isActive(): boolean           │  │  │  - version: int @Version   │   │
│   │  + isExpiringSoon(): boolean     │  │  │  - createdAt: Instant       │   │
│   │  + calculateProratedRent(): Money│  │  │  - updatedAt: Instant       │   │
│   │  + recordSigning(): void         │  │  │  - createdBy: String         │   │
│   │  + terminate(reason,date): void  │  │  │  - updatedBy: String         │   │
│   └─────────────────────────────────┘  │  │  - deletedAt: Instant        │   │
│                                          │  └──────────────────────────┘   │
│                                          │                                  │
│      MapStruct Mapper                     │   LeaseJpaEntity → Lease         │
│      LeaseMapper.INSTANCE                 │   (infrastructure adapter)       │
│      .toDomain(jpaEntity)                 │                                  │
│      .toJpaEntity(domain)                 │                                  │
└──────────────────────────────────────────┴──────────────────────────────────┘

                     ┌─────────────────────────────┐
                     │       LeaseRepository        │
                     │  (Domain Port — Interface)   │
                     │  ──────────────────────────  │
                     │  + findById(LeaseId): Lease  │
                     │  + save(Lease): Lease        │
                     │  + findByUnitAndOverlapping  │
                     │    (UnitId, DateRange):      │
                     │    List<Lease>               │
                     └─────────────┬───────────────┘
                                   │ implements
                     ┌─────────────▼───────────────┐
                     │   JpaLeaseRepositoryAdapter  │
                     │  (Infrastructure)            │
                     │  Uses Spring Data's          │
                     │  LeaseJpaRepository          │
                     │  + MapStruct for mapping     │
                     └─────────────────────────────┘
```

### 6.3 Repository Method Naming Convention

```
Spring Data JPA — Query Method Pattern:
─────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ Pattern                          │ Example                       │
├─────────────────────────────────────────────────────────────────┤
│ findBy{Field}                    │ findByEmail(String email)      │
│ findBy{Field}And{Field}          │ findByFirstNameAndLastName(..) │
│ findBy{Field}GreaterThan         │ findByAmountGreaterThan(BigDec)│
│ findBy{Field}Between             │ findByStartDateBetween(..)     │
│ findBy{Field}In                  │ findByStatusIn(List<Status>)   │
│ findBy{Field}Like                │ findByNameLike(String pattern) │
│ findBy{Field}IsNull              │ findByDeletedAtIsNull()        │
│ countBy{Field}                   │ countByStatus(Status status)   │
│ existsBy{Field}                  │ existsByEmail(String email)    │
│ findBy{Ref}_Id                   │ findByLease_Id(Long leaseId)   │
│ findBy{Field}OrderBy{Field)Asc   │ findByStatusOrderByCreatedAt() │
│ findBy{Ref}_{Field}              │ findByProperty_Type(Type type) │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Query Strategy Decision Tree

```
           ┌──────────────────────────────────────┐
           │  Need to query the database?          │
           └────────────────┬─────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
           Simple CRUD             Complex Query
                │                       │
                ▼                       ▼
    ┌─────────────────────┐   ┌─────────────────────┐
    │ Spring Data JPA     │   │ Multiple options:    │
    │ Derived Query       │   │                      │
    │ findBy...()         │   │ 1. @Query(JPQL)      │
    └─────────────────────┘   │    For moderate      │
                              │    complexity joins  │
                              │                      │
                              │ 2. Criteria API      │
                              │    For dynamic/      │
                              │    programmatic      │
                              │    query building    │
                              │                      │
                              │ 3. PostgreSQL View   │
                              │    For dashboard     │
                              │    read-models       │
                              │    (pre-joined)      │
                              │                      │
                              │ 4. MongoDB Aggr.     │
                              │    Pipeline          │
                              │    For audit/report  │
                              │    aggregations      │
                              └─────────────────────┘
```

### 6.5 Transaction Boundaries

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TRANSACTION BOUNDARY RULES                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Layer               │ Transaction Behaviour                         │
│  ────────────────────┼────────────────────────────────────────────── │
│  Presentation        │ ❌ NEVER @Transactional here                   │
│  Controller          │    (opens TX too early, too broad)            │
│                       │                                              │
│  Application         │ ✅ @Transactional on public use case methods  │
│  Use Case Service    │    • Read operations: readOnly=true          │
│                       │    • Write operations: default propagation   │
│                       │    • OptimisticLockException retry logic     │
│                       │                                              │
│  Domain               │ ❌ NEVER @Transactional here                  │
│  Entity               │    (domain is persistence-agnostic)          │
│                       │                                              │
│  Infrastructure       │ ❌ Avoid @Transactional on repositories      │
│  Repository           │    (let application layer manage TX)         │
│                       │                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  EXAMPLE: CreateLeaseService                                         │
│  ─────────────────────                                                │
│  @Transactional                                                        │
│  public Lease createLease(CreateLeaseCommand cmd) {                  │
│      // 1. Validate no overlapping lease (read within TX)           │
│      // 2. Create domain Lease entity                               │
│      // 3. Save Lease (flush)                                       │
│      // 4. Publish LeaseSignedEvent                                 │
│      // 5. Update Unit status to RENTED                             │
│      // 6. Return Lease                                             │
│  }                                                                    │
│  ALL 6 steps run in a SINGLE database transaction.                    │
│  If step 5 fails, steps 1-4 are rolled back.                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.6 MongoDB Collections & Indexing Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│  Collection            │ Documents       │ Indexes                  │
├────────────────────────┼─────────────────┼─────────────────────────┤
│  audit_logs            │ {               │ { actorId: 1,           │
│                        │   traceId,       │   timestamp: -1 }      │
│                        │   actorId,       │ { resourceType: 1,     │
│                        │   actorRole,     │   resourceId: 1 }      │
│                        │   action,        │ { timestamp: 1 },      │
│                        │   resourceType,  │ TTL: none (permanent)  │
│                        │   resourceId,    │                         │
│                        │   oldValue,      │                         │
│                        │   newValue,      │                         │
│                        │   ipAddress,     │                         │
│                        │   timestamp      │                         │
│                        │ }               │                         │
│                        │                 │                         │
│  ticket_comments       │ {               │ { ticketId: 1,          │
│                        │   ticketId,      │   createdAt: 1 }       │
│                        │   authorId,      │ { authorId: 1 }        │
│                        │   authorRole,    │ TTL: 365 days          │
│                        │   body,          │                         │
│                        │   attachments[], │                         │
│                        │   createdAt      │                         │
│                        │ }               │                         │
│                        │                 │                         │
│  notification_logs     │ {               │ { userId: 1,            │
│                        │   userId,        │   createdAt: -1 }      │
│                        │   type,          │ { type: 1,             │
│                        │   channel,       │   status: 1 }          │
│                        │   recipient,     │ TTL: 90 days           │
│                        │   subject,       │                         │
│                        │   status,        │                         │
│                        │   errorMessage,  │                         │
│                        │   createdAt      │                         │
│                        │ }               │                         │
│                        │                 │                         │
│  dashboard_snapshots   │ {               │ { type: 1,              │
│                        │   type,          │   period: 1 }          │
│                        │   period,        │ { createdAt: 1 },      │
│                        │   data,          │ TTL: 30 days           │
│                        │   computedAt,    │                         │
│                        │   createdAt      │                         │
│                        │ }               │                         │
│                        │                 │                         │
│  session_events        │ {               │ { userId: 1,            │
│                        │   userId,        │   eventType: 1 }       │
│                        │   eventType,     │ { ipAddress: 1 }       │
│                        │   ipAddress,     │ TTL: 90 days           │
│                        │   userAgent,     │                         │
│                        │   timestamp      │                         │
│                        │ }               │                         │
└────────────────────────┴─────────────────┴─────────────────────────┘
```

### 6.7 Soft-Delete Strategy (PostgreSQL)

```
┌─────────────────────────────────────────────────────────────────────┐
│  SOFT-DELETE PATTERN                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TABLE: properties                                                   │
│  ─────────────────────                                               │
│  id              BIGSERIAL    PRIMARY KEY                            │
│  name            VARCHAR(255) NOT NULL                               │
│  ...other columns...                                                 │
│  deleted_at      TIMESTAMP    NULL (NULL = active, value = deleted)  │
│  deleted_by      VARCHAR(50)  NULL                                   │
│                                                                      │
│  @SQLRestriction("deleted_at IS NULL")  ← Hibernate filter         │
│  public class PropertyJpaEntity { ... }                              │
│                                                                      │
│  Repository method:                                                   │
│  @Query("SELECT p FROM PropertyJpaEntity p WHERE p.deletedAt IS     │
│          NULL AND p.managerId = :managerId")                        │
│  List<PropertyJpaEntity> findActiveByManagerId(Long managerId);      │
│                                                                      │
│  Admin override:                                                      │
│  @Query("SELECT p FROM PropertyJpaEntity p")                        │
│  List<PropertyJpaEntity> findAllIncludingDeleted();                   │
│                                                                      │
│  CASCADE RULES:                                                       │
│  • Soft-delete Property → does NOT cascade to Units                 │
│  • Soft-delete Property → prevents new Lease creation               │
│  • Unit set to UNAVAILABLE when parent property deleted              │
│  • Existing active leases remain valid                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.8 Optimistic Locking (Concurrency Control)

```
┌─────────────────────────────────────────────────────────────────────┐
│  OPTIMISTIC LOCKING FLOW                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Scenario: Two managers try to update the same lease simultaneously  │
│                                                                      │
│  ┌──────┐                    ┌──────┐                                │
│  │Manager│                    │Manager│                                │
│  │   A   │                    │   B   │                                │
│  └───┬───┘                    └───┬───┘                                │
│      │                            │                                    │
│      │  GET /leases/123           │  GET /leases/123                   │
│      │  version=5                 │  version=5                         │
│      │◄──────────                 │◄──────────                         │
│      │                            │                                    │
│      │  PUT /leases/123           │  PUT /leases/123                   │
│      │  version=5                 │  version=5                         │
│      │───────────────────────────►│──────────────────────────────────►│
│      │                            │                                    │
│      │  UPDATE leases SET         │  UPDATE leases SET                 │
│      │  ... WHERE id=123          │  ... WHERE id=123                  │
│      │  AND version=5             │  AND version=5                     │
│      │  (SUCCESS: row affected=1) │  (FAIL: row affected=0)            │
│      │                            │                                    │
│      │  200 OK                    │  409 Conflict                      │
│      │  newVersion=6              │  "Optimistic lock exception:       │
│      │◄──────────                 │   Lease was updated by another     │
│      │                            │   user. Please refresh and retry." │
│      │                            │◄──────────                         │
│                                                                        │
│  ENTITY CONFIGURATION:                                                  │
│  @Version                                                             │
│  @Column(name = "version")                                            │
│  private int version;                                                  │
│                                                                        │
│  APPLICATION RETRY:                                                     │
│  @Retryable(                                                          │
│      retryFor = OptimisticLockingFailureException.class,              │
│      maxAttempts = 3,                                                 │
│      backoff = @Backoff(delay = 100))                                 │
│  public Lease updateLease(UpdateLeaseCommand cmd) {                   │
│      // re-read, re-apply, re-save                                    │
│  }                                                                     │
│                                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Security Flow

### 7.1 Security Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    SPRING SECURITY FILTER CHAIN                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────┐   ┌────────────┐   ┌──────────────┐   ┌───────────────┐  │
│  │ Security    │   │ CORS        │   │JwtAuthentication│ │ Exception     │  │
│  │ContextRepo  │──▶│ Filter      │──▶│ Filter        │──▶│ Translation   │  │
│  │ Filter      │   │             │   │ (OncePerReq)  │   │ Filter        │  │
│  └────────────┘   └────────────┘   └──────┬───────┘   └───────┬───────┘  │
│                                            │                    │          │
│  ┌────────────┐   ┌────────────┐   ┌──────┴───────┐   ┌───────┴───────┐  │
│  │ Logout      │   │ Request    │   │UsernamePasswd│   │ Filter Securi │  │
│  │ Filter      │◀──│ Cache      │◀──│ Auth Filter  │◀──│ Interceptor   │  │
│  └────────────┘   │ Filter     │   │ (for login   │   │               │  │
│                   └────────────┘   │  endpoint)    │   │               │  │
│                                     └──────────────┘   └───────────────┘  │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                    DispatcherServlet                               │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐     │   │
│  │  │ @RestController │  │ @Controller    │  │ Actuator         │     │   │
│  │  │ Endpoints       │  │ Views          │  │ Endpoints        │     │   │
│  │  └────────────────┘  └────────────────┘  └──────────────────┘     │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Security Configuration Zones

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SECURITY CONFIGURATION ZONES                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Public Zone                         ┌──────────────────────────────┐   │
│  (No authentication required)        │  POST /api/v1/auth/register  │   │
│                                      │  POST /api/v1/auth/login     │   │
│                                      │  POST /api/v1/auth/refresh    │   │
│                                      │  POST /api/v1/auth/forgot-   │   │
│                                      │       password               │   │
│                                      │  GET  /api/v1/health/**      │   │
│                                      │  GET  /error                 │   │
│                                      │  GET  /webjars/**            │   │
│                                      │  GET  /css/**                │   │
│                                      │  GET  /js/**                 │   │
│                                      │  GET  /images/**             │   │
│                                      └──────────────────────────────┘   │
│                                                                          │
│  Authenticated Zone                ┌──────────────────────────────┐   │
│  (Any authenticated user)           │  POST /api/v1/auth/logout   │   │
│                                     │  GET  /api/v1/users/me      │   │
│                                     │  PUT  /api/v1/users/me      │   │
│                                     │                              │   │
│                                     │  Thymeleaf views:           │   │
│                                     │  GET  /dashboard            │   │
│                                     │  GET  /profile              │   │
│                                     └──────────────────────────────┘   │
│                                                                          │
│  Role-Protected Zone              ┌──────────────────────────────┐   │
│  (@PreAuthorize on controller)     │  GET    /api/v1/properties   │   │
│                                   │  POST   /api/v1/properties   │   │
│                                   │  PUT    /api/v1/leases/{id}  │   │
│                                   │  DELETE /api/v1/tenants/{id} │   │
│                                   │                              │   │
│                                   │  Thymeleaf admin views:      │   │
│                                   │  GET  /admin/users           │   │
│                                   │  GET  /admin/audit-logs      │   │
│                                   └──────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 7.3 CSRF Configuration

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CSRF STRATEGY (Dual Configuration)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  API Endpoints (/api/v1/**)                    │ STATELESS              │
│  ──────────────────────────                    │ ────────               │
│  • CSRF disabled (no need for token-based      │                        │
│    auth since JWT is already a bearer token)   │  csrf().disable()      │
│  • Protected by JWT authentication             │                        │
│  • Stateless — no session                      │                        │
│                                                                          │
│  Web UI Endpoints (Thymeleaf views)            │ STATEFUL               │
│  ───────────────────────────────               │ ────────               │
│  • CSRF enabled                                │                        │
│  • CSRF token auto-injected into forms         │  csrf().csrfTokenRepo- │
│    via Thymeleaf: <input type="hidden"         │  sitory(CookieCsrfTo-  │
│    th:name="${_csrf.parameterName}"            │  kenRepository.with-   │
│    th:value="${_csrf.token}" />                │  HttpOnlyFalse())      │
│  • Session-based CSRF token storage            │                        │
│  • Required for all POST/PUT/PATCH/DELETE      │                        │
│    from browser forms                          │                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Method-Level Security (RBAC Enforcement)

```
┌────────────────────────────────────────────────────────────────────────┐
│  METHOD-LEVEL SECURITY ANNOTATIONS                                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Role-based (simple):                                                    │
│  ─────────────────────                                                    │
│  @PreAuthorize("hasRole('ADMIN')")                                      │
│  @PreAuthorize("hasAnyRole('ADMIN', 'PROPERTY_MANAGER')")              │
│  @PreAuthorize("hasRole('TENANT')")                                     │
│                                                                         │
│  Permission-based (resource-level):                                      │
│  ──────────────────────────────────                                      │
│  @PreAuthorize("hasPermission(#propertyId, 'PROPERTY', 'WRITE')")      │
│  @PreAuthorize("hasPermission(#leaseId, 'LEASE', 'READ')")             │
│                                                                         │
│  Owner-based (data-level):                                               │
│  ──────────────────────────                                               │
│  @PostFilter("hasPermission(filterObject, 'READ')")                    │
│  @PreAuthorize(#tenantId == authentication.principal.id)               │
│                                                                         │
│  Cross-cutting:                                                          │
│  ─────────────────                                                       │
│  @Secured("ROLE_ADMIN")           // Legacy annotation, still supported │
│  @RolesAllowed("ADMIN")           // JSR-250 standard                   │
│                                                                         │
│  ENABLED VIA: @EnableMethodSecurity                                     │
│                                                                         │
│  Usage example on a controller method:                                   │
│                                                                         │
│  @GetMapping("/api/v1/leases/{id}")                                     │
│  @PreAuthorize("hasPermission(#id, 'LEASE', 'READ')")                   │
│  public ResponseEntity<LeaseResponse> getLease(@PathVariable Long id) { │
│      Lease lease = leaseService.findById(id);                           │
│      return ResponseEntity.ok(LeaseResponse.from(lease));               │
│  }                                                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.5 Password Policy Enforcement (State Machine)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      PASSWORD STATE MACHINE                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                    ┌──────────────────┐                                  │
│                    │   REGISTERED     │                                  │
│                    │  (first time)    │                                  │
│                    └────────┬─────────┘                                  │
│                             │                                            │
│                             │ Set password (must pass policy)            │
│                             ▼                                            │
│                    ┌──────────────────┐     ┌─────────────────┐         │
│         ┌─────────►│    ACTIVE        │────►│   LOCKED        │         │
│         │          │  (can login)     │     │ (5 failed login │         │
│         │          └────────┬─────────┘     │  attempts)      │         │
│         │                   │                └────────┬────────┘         │
│         │                   │                         │                   │
│         │    Password       │ Login success            │ 15-min cooldown │
│         │    reset          │                          │ expires          │
│         │                   │                          │                   │
│         │          ┌────────▼─────────┐               │                   │
│         │          │   PASSWORD_EXPIR │               │                   │
│         │          │   ED (90 days)   │               │                   │
│         │          └────────┬─────────┘               │                   │
│         │                   │                          │                   │
│         │                   ▼                          ▼                   │
│         │          ┌──────────────────────────────────────┐               │
│         └──────────│      ACTIVE (new password)           │               │
│                    │   (password history updated)         │               │
│                    └──────────────────────────────────────┘               │
│                                                                          │
│  PASSWORD POLICY VALIDATION:                                              │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  • Min length: 12 characters                                     │   │
│  │  • At least 1 uppercase letter                                   │   │
│  │  • At least 1 lowercase letter                                   │   │
│  │  • At least 1 digit                                              │   │
│  │  • At least 1 special character (!@#$%^&*()_+-=[]{}|;':\",./<>) │   │
│  │  • No more than 3 consecutive identical characters               │   │
│  │  • Cannot contain: email prefix, name, or common patterns        │   │
│  │  • Not in last 5 password history                                │   │
│  │  • BCrypt hash (cost factor = 12)                                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 7.6 Audit Logging (AOP Aspect)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  AUDIT LOGGING — Aspect-Oriented                                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  @Aspect                                                                 │
│  @Component                                                              │
│  public class AuditAspect {                                              │
│                                                                          │
│      @Around("@annotation(auditable)")  // Custom @Auditable annotation  │
│      public Object auditMethod(ProceedingJoinPoint pjp,                  │
│                                  Auditable auditable) {                  │
│                                                                          │
│          // 1. Extract request context from MDC                         │
│          String traceId = MDC.get("traceId");                           │
│          String userId = MDC.get("userId");                             │
│          String userRole = MDC.get("userRole");                         │
│                                                                          │
│          // 2. Serialize method arguments (pre-state)                   │
│          String args = toJson(pjp.getArgs());                           │
│                                                                          │
│          // 3. Execute the actual method                                │
│          Object result = pjp.proceed();                                 │
│                                                                          │
│          // 4. Serialize result (post-state)                            │
│          String resultJson = toJson(result);                            │
│                                                                          │
│          // 5. Build audit log entry                                    │
│          AuditLogEntry entry = AuditLogEntry.builder()                  │
│              .traceId(traceId)                                          │
│              .actorId(userId)                                           │
│              .actorRole(userRole)                                       │
│              .action(auditable.action())                                │
│              .resourceType(auditable.resourceType())                    │
│              .resourceId(extractResourceId(pjp.getArgs()))              │
│              .oldValue(args)                                            │
│              .newValue(resultJson)                                      │
│              .ipAddress(MDC.get("ipAddress"))                           │
│              .timestamp(Instant.now())                                  │
│              .build();                                                   │
│                                                                          │
│          // 6. Persist to MongoDB (async)                               │
│          auditLogRepository.save(entry);                                │
│                                                                          │
│          return result;                                                  │
│      }                                                                   │
│  }                                                                       │
│                                                                          │
│  @Target(ElementType.METHOD)                                             │
│  @Retention(RetentionPolicy.RUNTIME)                                     │
│  public @interface Auditable {                                           │
│      String action();       // e.g., "CREATE_LEASE"                     │
│      String resourceType(); // e.g., "LEASE"                            │
│  }                                                                       │
│                                                                          │
│  Usage:                                                                   │
│  @Auditable(action = "CREATE_LEASE", resourceType = "LEASE")             │
│  public Lease createLease(CreateLeaseCommand cmd) { ... }                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 7.7 CORS Configuration

```
┌─────────────────────────────────────────────────────────────────────┐
│  CORS POLICY — Environment-Aware                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Local:     http://localhost:8080, http://localhost:3000             │
│  Dev:       https://dev.smartlease.com                              │
│  Staging:   https://staging.smartlease.com                          │
│  Production: https://app.smartlease.com                             │
│                                                                      │
│  Configuration Approach:                                             │
│  ─────────────────────────                                            │
│  @Bean                                                               │
│  public WebMvcConfigurer corsConfigurer() {                          │
│      return new WebMvcConfigurer() {                                 │
│          @Override                                                   │
│          public void addCorsMappings(CorsRegistry registry) {        │
│              registry.addMapping("/api/**")                         │
│                  .allowedOrigins(allowedOrigins)                     │
│                  .allowedMethods("GET","POST","PUT","PATCH",        │
│                                  "DELETE","OPTIONS")                 │
│                  .allowedHeaders("Authorization","Content-Type")    │
│                  .allowCredentials(false)  // JWT, not cookies       │
│                  .maxAge(3600);                                      │
│                                                                      │
│              registry.addMapping("/**")  // Thymeleaf views         │
│                  .allowedOrigins(sameOrigin)  // No cross-origin     │
│                  .allowCredentials(true);    // For CSRF cookie     │
│          }                                                           │
│      };                                                              │
│  }                                                                   │
│                                                                      │
│  // allowedOrigins injection via @Value:                             │
│  @Value("${app.cors.allowed-origins}")                              │
│  private String[] allowedOrigins;                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Deployment Architecture

### 8.1 Local Development Environment

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Developer Laptop                              │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    IntelliJ IDEA / Eclipse                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │    │
│  │  │  SmartLease   │  │  JUnit 5     │  │  Postman/       │    │    │
│  │  │  Application  │  │  Tests       │  │  REST Client    │    │    │
│  │  │  (Spring Boot)│  │  (Testcont.) │  │                 │    │    │
│  │  └──────┬───────┘  └──────────────┘  └──────────────────┘    │    │
│  └─────────┼────────────────────────────────────────────────────┘    │
│            │                                                          │
│            │  spring.profiles.active=local                            │
│            │  (H2 in-memory for PostgreSQL, embedded MongoDB)        │
│            │                                                          │
│  ┌─────────▼────────────────────────────────────────────────────┐    │
│  │                    Docker Compose                               │    │
│  │  ┌──────────────────────┐  ┌──────────────────────────────┐   │    │
│  │  │   PostgreSQL 16       │  │      MongoDB 7               │   │    │
│  │  │   Port: 5432          │  │      Port: 27017             │   │    │
│  │  │   DB: smartlease      │  │      DB: smartlease          │   │    │
│  │  └──────────────────────┘  └──────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  docker-compose.yml:                                                  │
│  ────────────────────                                                  │
│  version: '3.8'                                                       │
│  services:                                                            │
│    postgres:                                                          │
│      image: postgres:16-alpine                                        │
│      environment:                                                     │
│        POSTGRES_DB: smartlease                                        │
│        POSTGRES_USER: smartlease                                      │
│        POSTGRES_PASSWORD: smartlease                                  │
│      ports: ["5432:5432"]                                             │
│      volumes: [pgdata:/var/lib/postgresql/data]                      │
│                                                                       │
│    mongodb:                                                           │
│      image: mongo:7                                                   │
│      environment:                                                     │
│        MONGO_INITDB_DATABASE: smartlease                             │
│      ports: ["27017:27017"]                                          │
│      volumes: [mongoData:/data/db]                                   │
│                                                                       │
│    smartlease-app:                                                    │
│      build: .                                                         │
│      ports: ["8080:8080"]                                             │
│      environment:                                                     │
│        SPRING_PROFILES_ACTIVE: dev                                   │
│        DB_URL: jdbc:postgresql://postgres:5432/smartlease            │
│        MONGO_URI: mongodb://mongodb:27017/smartlease                 │
│      depends_on: [postgres, mongodb]                                 │
│      volumes: [./src:/app/src]  # hot-reload                         │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.2 Staging/Production Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION DEPLOYMENT                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                          ┌──────────────┐                                │
│                          │   Load        │                                │
│                          │   Balancer    │                                │
│                          │  (Round Robin)│                                │
│                          └──────┬───────┘                                │
│                                 │                                         │
│              ┌──────────────────┼──────────────────┐                     │
│              │                  │                  │                      │
│       ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐              │
│       │  App Instance│   │  App Instance│   │  App Instance│              │
│       │  (Java 17)   │   │  (Java 17)   │   │  (Java 17)   │              │
│       │  Port: 8080  │   │  Port: 8080  │   │  Port: 8080  │              │
│       │  Stateless   │   │  Stateless   │   │  Stateless   │              │
│       └──────┬───────┘   └──────┬───────┘   └──────┬───────┘              │
│              │                  │                  │                      │
│              └──────────────────┼──────────────────┘                      │
│                                 │                                         │
│                    ┌────────────▼────────────┐                           │
│                    │    Application Config    │                           │
│                    │    (Environment Vars)    │                           │
│                    │  • DB_URL                │                           │
│                    │  • MONGO_URI             │                           │
│                    │  • JWT_SECRET            │                           │
│                    │  • SMTP_*                │                           │
│                    │  • CORS_ORIGINS          │                           │
│                    │  • ENCRYPTION_KEY        │                           │
│                    └─────────────────────────┘                           │
│                                 │                                         │
│                    ┌────────────┴────────────┐                           │
│                    │                         │                            │
│              ┌─────▼──────┐           ┌──────▼─────┐                    │
│              │ PostgreSQL  │           │  MongoDB   │                    │
│              │ Primary-    │           │  Replica   │                    │
│              │ Replica     │           │  Set (3)   │                    │
│              │ (Managed)   │           │  (Managed) │                    │
│              └─────────────┘           └────────────┘                    │
│                                                                          │
│  DEPLOYMENT OPTIONS:                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Option 1: AWS Elastic Beanstalk (simplest)                        ││
│  │  • Single JAR deployment                                           ││
│  │  • Auto-scaling based on CPU/latency                               ││
│  │  • RDS for PostgreSQL                                              ││
│  │  • DocumentDB (MongoDB-compatible) or Atlas MongoDB                 ││
│  │                                                                     ││
│  │ Option 2: Docker + ECS / EKS (containerized)                      ││
│  │  • Docker image pushed to ECR                                      ││
│  │  • ECS Fargate (serverless containers) or EKS (Kubernetes)         ││
│  │  • RDS Aurora PostgreSQL for high availability                      ││
│  │  • MongoDB Atlas for managed MongoDB                                ││
│  │                                                                     ││
│  │ Option 3: Kubernetes (GKE/AKS/EKS)                                  ││
│  │  • Helm charts for deployment                                       ││
│  │  • ConfigMaps + Secrets for configuration                          ││
│  │  • Horizontal Pod Autoscaler                                       ││
│  │  • Cloud SQL / RDS for PostgreSQL                                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.3 CI/CD Pipeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      CI/CD PIPELINE                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│  │   Code   │    │  Build   │    │  Test    │    │ Package  │           │
│  │  Commit  │───▶│  (Maven) │───▶│ (JUnit,  │───▶│ (JAR)    │           │
│  │          │    │          │    │ ArchUnit)│    │          │           │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘           │
│                                                       │                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐         │                 │
│  │  Deploy   │    │  Docker  │    │  Image   │         │                 │
│  │  Staging  │◄───│  Build   │◄───│  Push    │◄────────┘                 │
│  │           │    │          │    │  (ECR)    │                          │
│  └──────────┘    └──────────┘    └──────────┘                          │
│       │                                                                  │
│       │  (Integration tests pass?)                                       │
│       ▼                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                          │
│  │  Deploy   │    │  Health  │    │  Smoke   │                          │
│  │  Prod     │───▶│  Check   │───▶│  Test    │                          │
│  │  (Rolling)│    │          │    │          │                          │
│  └──────────┘    └──────────┘    └──────────┘                          │
│                                                                          │
│  PIPELINE STAGES:                                                        │
│  ─────────────────                                                        │
│  1. Commit → Trigger pipeline                                           │
│  2. Checkout code                                                        │
│  3. Maven compile (-DskipITs=true)                                      │
│  4. Run unit tests (surefire)                                            │
│  5. Run integration tests (failsafe, Testcontainers)                    │
│  6. Run architecture tests (ArchUnit)                                   │
│  7. Generate coverage report (JaCoCo)                                   │
│  8. Static analysis (SpotBugs, Checkstyle)                              │
│  9. Package JAR (spring-boot-maven-plugin)                              │
│  10. Build Docker image                                                  │
│  11. Push image to container registry                                   │
│  12. Deploy to staging environment                                      │
│  13. Run smoke tests on staging                                          │
│  14. Deploy to production (rolling update, 20% at a time)               │
│  15. Health check (liveness + readiness)                                │
│  16. Notify team (Slack/Email)                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 8.4 Logging & Monitoring Stack

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Application Layer:                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Logback Configuration:                                            ││
│  │  ─────────────────────────                                          ││
│  │  • Local: Console appender, plain text, DEBUG level                ││
│  │  • Dev:   Console appender, plain text, INFO level                 ││
│  │  • Staging: RollingFile appender, JSON format, INFO level          ││
│  │  • Prod:   JSON appender → stdout (container logs), INFO level     ││
│  │                                                                     ││
│  │  MDC Fields:                                                        ││
│  │  {traceId, userId, userRole, tenantId, requestPath,                ││
│  │   requestMethod, responseStatus, durationMs}                       ││
│  │                                                                     ││
│  │  JSON Layout (prod):                                                ││
│  │  {"@timestamp":"...","level":"INFO","logger":"...",                 ││
│  │   "message":"Lease 123 created","mdc":{...}}                       ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  Infrastructure Layer (if available):                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  • Log Aggregation: OpenSearch / ELK Stack                         ││
│  │  • Metrics:     Micrometer → Prometheus → Grafana                  ││
│  │  • APM:         Elastic APM Agent or Datadog                       ││
│  │  • Alerting:    Grafana Alerts / PagerDuty                         ││
│  │  • Uptime:      Health check → CloudWatch / StatusCake             ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  Health Endpoints:                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  GET /api/v1/health/liveness    → 200 OK if app context loaded     ││
│  │  GET /api/v1/health/readiness   → 200 OK if DB connections work   ││
│  │  GET /api/v1/health/started     → 200 OK if fully initialized     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 8.5 Environment Configuration Matrix

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Property                     │ local    │ dev       │ staging   │ prod  │
├───────────────────────────────┼──────────┼───────────┼───────────┼───────┤
│  server.port                  │ 8080     │ 8080      │ 8080      │ 8080  │
│  spring.datasource.url        │ H2 mem   │ local PG  │ cloud PG  │ RDS   │
│  spring.jpa.show-sql          │ true     │ false     │ false     │ false │
│  spring.jpa.hibernate.ddl-auto│ update   │ validate  │ validate  │ none  │
│  spring.flyway.enabled        │ false    │ true      │ true      │ true  │
│  app.jwt.secret               │ test_key  │ env var   │ env var   │ KMS   │
│  app.jwt.expiration-ms        │ 900000   │ 900000    │ 900000    │ 900000│
│  app.cors.allowed-origins     │ *        │ dev URL   │ stg URL   │ prod  │
│  logging.level.com.smartlease │ DEBUG    │ INFO      │ INFO      │ INFO  │
│  logging.pattern.console      │ plain    │ plain     │ JSON      │ JSON  │
│  spring.devtools.restart      │ true     │ false     │ false     │ false │
│  management.endpoints.enabled │ all      │ all       │ health    │ health│
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Architecture Decision Records (ADRs)

| ADR | Decision | Rationale |
|---|---|---|
| **ADR-001** | **Dual DB (PostgreSQL + MongoDB)** | PostgreSQL handles transactional, consistency-critical data (leases, payments, properties). MongoDB handles append-heavy, schema-flexible data (audit logs, ticket comments). Each optimized for its workload. |
| **ADR-002** | **Single-module Maven with strict package boundaries** | Faster iteration for current team size (3-5 devs). Extract to multi-module when module compilation independence or independent deployments are needed. |
| **ADR-003** | **Thymeleaf over SPA** | Simpler to build and secure. Server-side rendering with Bootstrap 5 is sufficient for an internal property management tool. No CORS/OAuth complexity. |
| **ADR-004** | **Soft-delete for core entities** | Audit compliance and data recovery. Deleted records are flagged via `deleted_at` and excluded from queries via `@SQLRestriction`. |
| **ADR-005** | **Separate domain model from JPA entities** | Prevents JPA/Hibernate coupling to business logic. Allows rich domain model with behaviour, no persistence concerns. Mapped via MapStruct at the infrastructure boundary. |
| **ADR-006** | **JWT over session-based auth** | Stateless scaling. No session store needed. Fine-grained claims enable efficient RBAC. Refresh tokens in DB provide revocation capability. |
| **ADR-007** | **Constructor injection only** | Enforces immutability, testability, and clear dependencies. No field injection (`@Autowired`), no setter injection. |
| **ADR-008** | **@Version optimistic locking** | Best fit for this domain: lease and invoice conflicts are rare but critical. No need for pessimistic locks that harm throughput. |
| **ADR-009** | **Flyway for PostgreSQL migrations** | Version-controlled, repeatable, and auditable database schema changes. Integrates with Spring Boot auto-configuration. |
| **ADR-010** | **Audit logging to MongoDB** | Immutable, write-once storage. No schema migration needed for changing audit fields. Fast range queries on timestamps. |

---

> *This architecture document is the technical blueprint for SmartLease. All implementation must conform to the structures, flows, and decisions documented herein.*  
> *For business requirements, see [REQUIREMENTS.md](./REQUIREMENTS.md).*  
> *For project context and standards, see [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).*
