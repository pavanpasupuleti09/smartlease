# SmartLease — Requirements Specification

> **Product Requirements Document (PRD)** — Rental Property Management System  
> *Version 1.0* | *Status: Draft* | *Last Updated: July 28, 2026*

---

## Table of Contents

1. [Business Goals](#1-business-goals)
2. [Product Vision](#2-product-vision)
3. [Functional Requirements](#3-functional-requirements)
   - 3.1. Authentication Module
   - 3.2. Property Management Module
   - 3.3. Tenant Management Module
   - 3.4. Lease Management Module
   - 3.5. Rent Collection Module
   - 3.6. Maintenance Tickets Module
   - 3.7. Dashboard Module
   - 3.8. Cross-Cutting Requirements
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [User Roles & Permissions Matrix](#5-user-roles--permissions-matrix)
6. [User Stories](#6-user-stories)
   - 6.1. Authentication
   - 6.2. Property Management
   - 6.3. Tenant Management
   - 6.4. Lease Management
   - 6.5. Rent Collection
   - 6.6. Maintenance Tickets
   - 6.7. Dashboard
7. [Acceptance Criteria by Module](#7-acceptance-criteria-by-module)
8. [Assumptions & Dependencies](#8-assumptions--dependencies)
9. [Out of Scope](#9-out-of-scope)
10. [Glossary](#10-glossary)

---

## 1. Business Goals

| # | Goal | Success Metric | Target |
|---|---|---|---|
| BG-01 | **Reduce administrative overhead** for property managers by automating rent collection, invoice generation, and payment reconciliation | Hours saved per property per month | ≥ 8 hours |
| BG-02 | **Minimize rent delinquency** through automated reminders, late fee calculation, and delinquency dashboards | Average days overdue per invoice | ≤ 5 days |
| BG-03 | **Improve maintenance response time** by enforcing SLAs, automated vendor assignment, and status tracking | Mean time to resolution (MTTR) for urgent tickets | ≤ 24 hours |
| BG-04 | **Increase portfolio occupancy rate** via lease expiry alerts and vacancy tracking | Portfolio occupancy rate | ≥ 92% |
| BG-05 | **Provide a single source of truth** for property, tenant, lease, and financial data across the organization | Audit completeness for financial transactions | 100% traceability |
| BG-06 | **Ensure regulatory compliance** through audit logging, role-based access, and secure PII handling | Compliance audit pass rate | 100% |
| BG-07 | **Enable data-driven decision making** with real-time dashboards for occupancy, revenue, and maintenance KPIs | Dashboard daily active users | ≥ 80% of managers |
| BG-08 | **Support multi-property portfolio management** from a single interface | Properties managed per user | Unlimited |

---

## 2. Product Vision

For **property owners and managers** who need to efficiently oversee their rental portfolios,  
SmartLease is a **Rental Property Management System**  
that **automates lease lifecycle, rent collection, and maintenance operations**  
unlike traditional spreadsheet-based or fragmented tools,  
our product provides **a unified, secure, and real-time platform** with role-based access for all stakeholders.

---

## 3. Functional Requirements

### 3.1 Authentication Module

| ID | Requirement | Priority | Dependencies |
|---|---|---|---|
| FR-AUTH-01 | System shall allow users to register with email, password, name, and role assignment | P0 | — |
| FR-AUTH-02 | System shall authenticate users via email and password using BCrypt-hashed credentials | P0 | FR-AUTH-01 |
| FR-AUTH-03 | System shall issue a JWT access token (15-min expiry) and a refresh token (7-day expiry) upon successful login | P0 | FR-AUTH-02 |
| FR-AUTH-04 | System shall support token refresh via a valid refresh token endpoint | P0 | FR-AUTH-03 |
| FR-AUTH-05 | System shall enforce password policy: ≥12 chars, mixed case, digits, special chars | P0 | FR-AUTH-01 |
| FR-AUTH-06 | System shall lock account after 5 consecutive failed login attempts (15-min lockout) | P0 | FR-AUTH-02 |
| FR-AUTH-07 | System shall support password reset via email verification link | P1 | FR-AUTH-02 |
| FR-AUTH-08 | System shall allow administrators to manage user roles and permissions | P0 | FR-AUTH-01 |
| FR-AUTH-09 | System shall log all authentication events (login, logout, failed attempts) to MongoDB audit log | P1 | FR-AUTH-02 |
| FR-AUTH-10 | System shall support logout by revoking the refresh token and blacklisting the access token | P0 | FR-AUTH-03 |

### 3.2 Property Management Module

| ID | Requirement | Priority | Dependencies |
|---|---|---|---|
| FR-PROP-01 | System shall allow authorized users to create a property with name, type (RESIDENTIAL/COMMERCIAL), address, description, and custom attributes | P0 | FR-AUTH-02 |
| FR-PROP-02 | System shall allow updating property details with full audit trail | P0 | FR-PROP-01 |
| FR-PROP-03 | System shall support soft-deletion of properties (marked as deleted, never physically removed) | P0 | FR-PROP-01 |
| FR-PROP-04 | System shall support adding/removing units within a property with attributes: unit number, floor, bedrooms, bathrooms, square footage, monthly rent | P0 | FR-PROP-01 |
| FR-PROP-05 | System shall track unit status: AVAILABLE, RENTED, MAINTENANCE, RESERVED, UNAVAILABLE | P0 | FR-PROP-04 |
| FR-PROP-06 | System shall support uploading and managing property images (max 10 per property) | P2 | FR-PROP-01 |
| FR-PROP-07 | System shall support flexible property attributes via JSONB to capture market-specific fields | P1 | FR-PROP-01 |
| FR-PROP-08 | System shall allow searching/filtering properties by name, status, type, location, rent range, and availability | P0 | FR-PROP-04 |
| FR-PROP-09 | System shall return paginated property search results (default 20 per page) | P0 | FR-PROP-08 |

### 3.3 Tenant Management Module

| ID | Requirement | Priority | Dependencies |
|---|---|---|---|
| FR-TEN-01 | System shall allow authorized users to create a tenant profile with full name, email, phone, emergency contact, and government ID reference | P0 | FR-AUTH-02 |
| FR-TEN-02 | System shall support tenant document upload (lease agreement, ID proof, income proof) via MongoDB GridFS | P1 | FR-TEN-01 |
| FR-TEN-03 | System shall maintain tenant lease history across all properties and units | P0 | FR-TEN-01, FR-LEASE-01 |
| FR-TEN-04 | System shall store tenant contact and communication preferences (Email/SMS/In-App) | P1 | FR-TEN-01 |
| FR-TEN-05 | System shall allow searching tenants by name, email, phone, or associated property | P0 | FR-TEN-01 |
| FR-TEN-06 | System shall enforce that a tenant cannot be actively leased in two units simultaneously | P0 | FR-TEN-01 |
| FR-TEN-07 | System shall support soft-deletion of tenant records | P1 | FR-TEN-01 |
| FR-TEN-08 | System shall encrypt PII fields (government ID, phone, emergency contact) at rest | P0 | FR-TEN-01 |

### 3.4 Lease Management Module

| ID | Requirement | Priority | Dependencies |
|---|---|---|---|
| FR-LEASE-01 | System shall allow creating a lease agreement linking a tenant to a unit with start date, end date, rent amount, deposit amount, and terms | P0 | FR-PROP-04, FR-TEN-01 |
| FR-LEASE-02 | System shall prevent overlapping active leases for the same unit | P0 | FR-LEASE-01 |
| FR-LEASE-03 | System shall prevent overlapping active leases for the same tenant | P0 | FR-LEASE-01 |
| FR-LEASE-04 | System shall support lease renewal — creating a new lease that starts immediately after the current one ends | P0 | FR-LEASE-01 |
| FR-LEASE-05 | System shall support early lease termination with penalty calculation and reason tracking | P0 | FR-LEASE-01 |
| FR-LEASE-06 | System shall support rent schedule definitions: base rent, escalation percentage, escalation frequency, discounts, and promotional periods | P0 | FR-LEASE-01 |
| FR-LEASE-07 | System shall track security deposit with ledger entries for deposits, deductions, and refunds | P0 | FR-LEASE-01 |
| FR-LEASE-08 | System shall generate lease document PDF with all terms and digital signature placeholders | P2 | FR-LEASE-01 |
| FR-LEASE-09 | System shall send alerts when a lease is within 30 days of expiry | P0 | FR-LEASE-01 |
| FR-LEASE-10 | System shall maintain full audit history of all lease modifications (terms, dates, rent changes) | P0 | FR-LEASE-01 |

### 3.5 Rent Collection Module

| ID | Requirement | Priority | Dependencies |
|---|---|---|---|
| FR-RENT-01 | System shall automatically generate monthly invoices for each active lease based on the rent schedule | P0 | FR-LEASE-06 |
| FR-RENT-02 | System shall allow one-time or recurring invoice generation | P1 | FR-RENT-01 |
| FR-RENT-03 | System shall record payments against invoices with amount, payment date, payment method (CASH/CHECK/BANK_TRANSFER/CREDIT_CARD/ONLINE), and reference number | P0 | FR-RENT-01 |
| FR-RENT-04 | System shall support partial payments and track remaining balance | P0 | FR-RENT-03 |
| FR-RENT-05 | System shall calculate and apply late fees based on configured rules (grace period, fee percentage, flat fee cap) | P0 | FR-RENT-01 |
| FR-RENT-06 | System shall automatically send payment reminders 7 days before due date, on due date, and daily after 3-day grace period | P0 | FR-RENT-01 |
| FR-RENT-07 | System shall generate a payment receipt with transaction ID, payment breakdown, and remaining balance | P0 | FR-RENT-03 |
| FR-RENT-08 | System shall provide invoice statuses: PENDING, PARTIALLY_PAID, PAID, OVERPAID, CANCELLED, REFUNDED | P0 | FR-RENT-01 |
| FR-RENT-09 | System shall reconcile payments to invoices with full ledger audit trail | P0 | FR-RENT-03 |
| FR-RENT-10 | System shall generate aging reports showing overdue invoices by 0–30, 31–60, 61–90, 90+ day buckets | P1 | FR-RENT-01 |

### 3.6 Maintenance Tickets Module

| ID | Requirement | Priority | Dependencies |
|---|---|---|---|
| FR-MAINT-01 | System shall allow tenants and managers to create maintenance tickets with title, description, priority (LOW/MEDIUM/HIGH/URGENT), category, and unit association | P0 | FR-AUTH-02, FR-PROP-04 |
| FR-MAINT-02 | System shall support ticket status workflow: OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED (with optional REOPENED state) | P0 | FR-MAINT-01 |
| FR-MAINT-03 | System shall allow managers to assign tickets to vendors or internal staff | P0 | FR-MAINT-02 |
| FR-MAINT-04 | System shall enforce SLA targets per priority: URGENT ≤ 4h, HIGH ≤ 24h, MEDIUM ≤ 72h, LOW ≤ 120h | P0 | FR-MAINT-01 |
| FR-MAINT-05 | System shall escalate tickets that breach SLA thresholds to the next management level | P0 | FR-MAINT-04 |
| FR-MAINT-06 | System shall maintain a vendor directory with name, trade specialty, contact, rate, and rating | P1 | — |
| FR-MAINT-07 | System shall support threaded comments/conversations on each ticket (stored in MongoDB) | P1 | FR-MAINT-01 |
| FR-MAINT-08 | System shall allow uploading images and attachments to tickets (max 5 per ticket, 10 MB each) | P2 | FR-MAINT-01 |
| FR-MAINT-09 | System shall send notifications on ticket status changes to the reporter and assignee | P1 | FR-MAINT-02 |
| FR-MAINT-10 | System shall provide ticket search and filter by status, priority, assignee, unit, date range, and keyword | P0 | FR-MAINT-01 |

### 3.7 Dashboard Module

| ID | Requirement | Priority | Dependencies |
|---|---|---|---|
| FR-DASH-01 | System shall display occupancy rate (percentage of leased units vs total units) | P0 | FR-PROP-05, FR-LEASE-01 |
| FR-DASH-02 | System shall display real-time rent collection metrics: total collected (MTD), total outstanding, collection rate | P0 | FR-RENT-03 |
| FR-DASH-03 | System shall display delinquency rate (percentage of overdue invoices) | P0 | FR-RENT-05 |
| FR-DASH-04 | System shall display maintenance KPIs: open tickets, avg resolution time, tickets by priority | P0 | FR-MAINT-02 |
| FR-DASH-05 | System shall display lease expiry timeline showing leases expiring in next 30/60/90 days | P0 | FR-LEASE-09 |
| FR-DASH-06 | System shall display revenue trend chart (monthly collection over past 12 months) | P1 | FR-RENT-03 |
| FR-DASH-07 | System shall display alerts section for urgent items (breached SLAs, overdue invoices > 30 days, expiring leases < 15 days) | P0 | FR-MAINT-04, FR-RENT-08, FR-LEASE-09 |
| FR-DASH-08 | System shall allow role-specific dashboard views (managers see portfolio-wide, tenants see self-only) | P0 | FR-DASH-01–07 |
| FR-DASH-09 | System shall support exporting dashboard data as CSV/PDF reports | P2 | FR-DASH-01–07 |
| FR-DASH-10 | System shall refresh dashboard data within 60 seconds of underlying data changes | P0 | FR-DASH-01–07 |

### 3.8 Cross-Cutting Requirements

| ID | Requirement | Priority | Dependencies |
|---|---|---|---|
| FR-CROSS-01 | System shall support both REST API (for programmatic access) and Thymeleaf web UI (for browser access) | P0 | — |
| FR-CROSS-02 | System shall provide consistent JSON API envelope for all REST responses (status, code, message, data, errors, timestamp, path) | P0 | — |
| FR-CROSS-03 | System shall implement pagination for all list endpoints (page, size, totalElements, totalPages, sort) | P0 | — |
| FR-CROSS-04 | System shall validate all user inputs at the presentation boundary (server-side validation) | P0 | — |
| FR-CROSS-05 | System shall log every mutating operation (POST/PUT/PATCH/DELETE) to the MongoDB audit trail | P0 | — |
| FR-CROSS-06 | System shall support multi-language messages via Spring internationalization (i18n) | P2 | — |
| FR-CROSS-07 | System shall enforce CORS policies configurable per environment | P1 | — |
| FR-CROSS-08 | System shall provide health check endpoints for monitoring (liveness, readiness) | P1 | — |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-PERF-01 | API response time (p95) for reads (GET by ID, list queries) | ≤ 200 ms |
| NFR-PERF-02 | API response time (p95) for writes (POST, PUT, PATCH) | ≤ 500 ms |
| NFR-PERF-03 | Dashboard page load time (p95) | ≤ 1.5 seconds |
| NFR-PERF-04 | Concurrent authenticated users supported | ≥ 500 |
| NFR-PERF-05 | Bulk invoice generation for portfolio of 1,000 units | ≤ 30 seconds |
| NFR-PERF-06 | Search results pagination response time | ≤ 300 ms |
| NFR-PERF-07 | Database query execution time (p99) | ≤ 100 ms |
| NFR-PERF-08 | Static asset (CSS/JS) load time | ≤ 100 ms (CDN-cached) |

### 4.2 Security

| ID | Requirement | Target |
|---|---|---|
| NFR-SEC-01 | All API endpoints except auth (login, register, refresh, forgot-password) require JWT authentication | Mandatory |
| NFR-SEC-02 | Passwords hashed with BCrypt (cost factor 12) | Mandatory |
| NFR-SEC-03 | PII fields encrypted at rest using AES-256 | Mandatory |
| NFR-SEC-04 | JWT access token must have a configurable expiry (default 15 minutes) | Mandatory |
| NFR-SEC-05 | Refresh tokens must be stored in DB and revocable | Mandatory |
| NFR-SEC-06 | All API calls must be over HTTPS in non-local environments | Mandatory |
| NFR-SEC-07 | System must protect against OWASP Top 10 (SQL injection, XSS, CSRF, etc.) | Mandatory |
| NFR-SEC-08 | Failed login attempts must be rate-limited (10 req/min per IP) | Mandatory |
| NFR-SEC-09 | Session timeout for web UI after 30 minutes of inactivity | Desired |

### 4.3 Reliability & Availability

| ID | Requirement | Target |
|---|---|---|
| NFR-REL-01 | System uptime (excluding planned maintenance) | ≥ 99.5% |
| NFR-REL-02 | Graceful handling of database connection failures with meaningful error messages | Mandatory |
| NFR-REL-03 | Automatic retry (max 3 attempts) for optimistic locking conflicts | Mandatory |
| NFR-REL-04 | All transactional operations must be ACID-compliant via PostgreSQL | Mandatory |
| NFR-REL-05 | System must handle concurrent updates to the same lease/invoice without data corruption (optimistic locking) | Mandatory |
| NFR-REL-06 | Audit logs must be write-once, never modified or deleted | Mandatory |

### 4.4 Scalability

| ID | Requirement | Target |
|---|---|---|
| NFR-SCAL-01 | Horizontal scaling: application must be stateless (no session affinity) | Mandatory |
| NFR-SCAL-02 | Support up to 10,000 properties and 50,000 units in a single database instance | Mandatory |
| NFR-SCAL-03 | MongoDB collections (audit_logs, ticket_comments) must be indexed for TTL-based automatic archival | Mandatory |
| NFR-SCAL-04 | Database connection pooling (HikariCP) with configurable max pool size | Mandatory |

### 4.5 Maintainability

| ID | Requirement | Target |
|---|---|---|
| NFR-MAINT-01 | Clean Architecture layers must be strictly enforced (domain has zero external dependencies) | Mandatory |
| NFR-MAINT-02 | DTOs must not be reused across architectural layers | Mandatory |
| NFR-MAINT-03 | Unit test coverage for domain layer | ≥ 95% |
| NFR-MAINT-04 | Unit test coverage for application layer | ≥ 90% |
| NFR-MAINT-05 | Integration tests for all repository and service classes | Mandatory |
| NFR-MAINT-06 | ArchUnit tests must verify package dependency rules on every build | Mandatory |
| NFR-MAINT-07 | OpenAPI/Swagger documentation auto-generated from annotations | Mandatory |

### 4.6 Usability

| ID | Requirement | Target |
|---|---|---|
| NFR-UI-01 | Web UI must be responsive and mobile-friendly (Bootstrap 5) | Mandatory |
| NFR-UI-02 | Forms must display inline validation errors | Mandatory |
| NFR-UI-03 | All actions must provide visual feedback (loading spinners, success toasts, error alerts) | Mandatory |
| NFR-UI-04 | Navigation must follow consistent layout (sidebar + top navbar + main content) | Mandatory |
| NFR-UI-05 | Error pages must be user-friendly (404, 500, access-denied) | Mandatory |

### 4.7 Observability

| ID | Requirement | Target |
|---|---|---|
| NFR-OBS-01 | Structured JSON logging with MDC fields (traceId, userId, requestPath) | Mandatory |
| NFR-OBS-02 | Health check endpoints: `/api/v1/health/liveness`, `/api/v1/health/readiness` | Mandatory |
| NFR-OBS-03 | Request tracing via unique traceId per request | Mandatory |
| NFR-OBS-04 | Log levels properly classified: ERROR (system failure), WARN (business violation), INFO (state change) | Mandatory |

---

## 5. User Roles & Permissions Matrix

| Permission | ADMIN | PROPERTY_MANAGER | TENANT | VENDOR | VIEWER |
|---|---|---|---|---|---|
| **User Management** | | | | | |
| Create/Edit Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assign Roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Property Management** | | | | | |
| Create/Edit Property | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Property (soft) | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Property Details | ✅ | ✅ | ✅ (own lease only) | ✅ (assigned unit) | ✅ |
| **Tenant Management** | | | | | |
| Create/Edit Tenant | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Tenant Profile | ✅ | ✅ | ✅ (self only) | ❌ | ❌ |
| **Lease Management** | | | | | |
| Create/Edit Lease | ✅ | ✅ | ❌ | ❌ | ❌ |
| Terminate Lease | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Lease Details | ✅ | ✅ | ✅ (own lease) | ❌ | ✅ |
| **Rent Collection** | | | | | |
| Generate Invoices | ✅ | ✅ | ❌ | ❌ | ❌ |
| Record Payments | ✅ | ✅ | ✅ (self-pay) | ❌ | ❌ |
| View Invoices | ✅ | ✅ | ✅ (own) | ❌ | ✅ |
| View Payment History | ✅ | ✅ | ✅ (own) | ❌ | ✅ |
| **Maintenance** | | | | | |
| Create Ticket | ✅ | ✅ | ✅ | ✅ | ❌ |
| Assign Ticket | ✅ | ✅ | ❌ | ❌ | ❌ |
| View All Tickets | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Own Tickets | ✅ | ✅ | ✅ | ✅ (assigned) | ❌ |
| Update Ticket Status | ✅ | ✅ | ❌ | ✅ (assigned) | ❌ |
| **Dashboard** | | | | | |
| Portfolio Dashboard | ✅ | ✅ | ❌ | ❌ | ✅ |
| Self-Service Dashboard | ✅ | ✅ | ✅ | ✅ | ❌ |

**Legend**: ✅ = Full access, ❌ = No access

---

## 6. User Stories

### 6.1 Authentication Stories

| ID | Story | Role | Acceptance Criteria |
|---|---|---|---|
| US-AUTH-01 | As a **new user**, I want to **register an account** so that **I can access the system** | All roles | See AC-AUTH-01 |
| US-AUTH-02 | As a **registered user**, I want to **log in with my credentials** so that **I can access my authorized features** | All roles | See AC-AUTH-02 |
| US-AUTH-03 | As a **user**, I want to **stay logged in across sessions** so that **I don't have to re-enter credentials frequently** | All roles | See AC-AUTH-03 |
| US-AUTH-04 | As an **admin**, I want to **manage user roles and permissions** so that **the right people have the right access** | ADMIN | See AC-AUTH-04 |
| US-AUTH-05 | As a **user**, I want to **reset my password** so that **I can regain access if I forget it** | All roles | See AC-AUTH-05 |

### 6.2 Property Management Stories

| ID | Story | Role | Acceptance Criteria |
|---|---|---|---|
| US-PROP-01 | As a **property manager**, I want to **add a new property with all details** so that **I can start managing it in the system** | PROPERTY_MANAGER | See AC-PROP-01 |
| US-PROP-02 | As a **property manager**, I want to **add units to a property** so that **I can track individual rentable spaces** | PROPERTY_MANAGER | See AC-PROP-02 |
| US-PROP-03 | As a **property manager**, I want to **update unit status** so that **availability is always accurate** | PROPERTY_MANAGER | See AC-PROP-03 |
| US-PROP-04 | As a **property manager**, I want to **search and filter properties** so that **I can quickly find what I need** | PROPERTY_MANAGER | See AC-PROP-04 |
| US-PROP-05 | As a **property manager**, I want to **remove a property from active management** so that **I can retire it without losing historical data** | PROPERTY_MANAGER | See AC-PROP-05 |

### 6.3 Tenant Management Stories

| ID | Story | Role | Acceptance Criteria |
|---|---|---|---|
| US-TEN-01 | As a **property manager**, I want to **onboard a new tenant** so that **I can capture all their details and documents** | PROPERTY_MANAGER | See AC-TEN-01 |
| US-TEN-02 | As a **property manager**, I want to **view a tenant's complete history** so that **I can make informed decisions about renewals** | PROPERTY_MANAGER | See AC-TEN-02 |
| US-TEN-03 | As a **property manager**, I want to **search for a tenant** so that **I can quickly pull up their information** | PROPERTY_MANAGER | See AC-TEN-03 |
| US-TEN-04 | As a **tenant**, I want to **view my own profile** so that **I can verify my information is correct** | TENANT | See AC-TEN-04 |

### 6.4 Lease Management Stories

| ID | Story | Role | Acceptance Criteria |
|---|---|---|---|
| US-LEASE-01 | As a **property manager**, I want to **create a lease for a tenant and unit** so that **the rental agreement is formalized** | PROPERTY_MANAGER | See AC-LEASE-01 |
| US-LEASE-02 | As a **property manager**, I want to **prevent double-booking a unit** so that **no two active leases overlap for the same unit** | PROPERTY_MANAGER | See AC-LEASE-02 |
| US-LEASE-03 | As a **property manager**, I want to **renew an expiring lease** so that **the tenant can continue renting seamlessly** | PROPERTY_MANAGER | See AC-LEASE-03 |
| US-LEASE-04 | As a **property manager**, I want to **terminate a lease early** so that **I can handle tenants who need to leave before the end date** | PROPERTY_MANAGER | See AC-LEASE-04 |
| US-LEASE-05 | As a **property manager**, I want to **be alerted when leases are about to expire** so that **I can plan renewals in advance** | PROPERTY_MANAGER | See AC-LEASE-05 |

### 6.5 Rent Collection Stories

| ID | Story | Role | Acceptance Criteria |
|---|---|---|---|
| US-RENT-01 | As a **property manager**, I want to **automatically generate monthly invoices** so that **I don't have to manually bill each tenant** | PROPERTY_MANAGER | See AC-RENT-01 |
| US-RENT-02 | As a **tenant**, I want to **view my invoices** so that **I know how much I owe and when** | TENANT | See AC-RENT-02 |
| US-RENT-03 | As a **property manager**, I want to **record a payment against an invoice** so that **the tenant's balance is updated** | PROPERTY_MANAGER | See AC-RENT-03 |
| US-RENT-04 | As a **property manager**, I want to **automatically calculate and apply late fees** so that **tenants are incentivized to pay on time** | PROPERTY_MANAGER | See AC-RENT-04 |
| US-RENT-05 | As a **property manager**, I want to **view an aging report** so that **I can manage delinquent accounts effectively** | PROPERTY_MANAGER | See AC-RENT-05 |
| US-RENT-06 | As a **tenant**, I want to **receive payment reminders** so that **I don't miss a payment deadline** | TENANT | See AC-RENT-06 |

### 6.6 Maintenance Tickets Stories

| ID | Story | Role | Acceptance Criteria |
|---|---|---|---|
| US-MAINT-01 | As a **tenant**, I want to **report a maintenance issue** so that **it gets logged and addressed** | TENANT | See AC-MAINT-01 |
| US-MAINT-02 | As a **property manager**, I want to **assign tickets to vendors** so that **issues are resolved quickly** | PROPERTY_MANAGER | See AC-MAINT-02 |
| US-MAINT-03 | As a **vendor**, I want to **update ticket status** so that **everyone knows the progress** | VENDOR | See AC-MAINT-03 |
| US-MAINT-04 | As a **property manager**, I want to **be alerted when SLA is breached** so that **I can escalate urgent issues** | PROPERTY_MANAGER | See AC-MAINT-04 |
| US-MAINT-05 | As a **property manager**, I want to **view all open tickets for my properties** so that **I can prioritize work** | PROPERTY_MANAGER | See AC-MAINT-05 |
| US-MAINT-06 | As a **tenant**, I want to **add comments to my ticket** so that **I can provide updates or ask questions** | TENANT | See AC-MAINT-06 |

### 6.7 Dashboard Stories

| ID | Story | Role | Acceptance Criteria |
|---|---|---|---|
| US-DASH-01 | As a **property manager**, I want to **see portfolio occupancy at a glance** so that **I can focus on filling vacancies** | PROPERTY_MANAGER | See AC-DASH-01 |
| US-DASH-02 | As a **property manager**, I want to **see rent collection performance** so that **I can identify collection issues early** | PROPERTY_MANAGER | See AC-DASH-02 |
| US-DASH-03 | As a **property manager**, I want to **see maintenance workload and SLA compliance** so that **I can allocate resources effectively** | PROPERTY_MANAGER | See AC-DASH-03 |
| US-DASH-04 | As a **property manager**, I want to **see upcoming lease expirations** so that **I can plan renewals and marketing** | PROPERTY_MANAGER | See AC-DASH-04 |
| US-DASH-05 | As a **tenant**, I want to **see my own dashboard** so that **I can check my lease status, invoices, and open tickets in one place** | TENANT | See AC-DASH-05 |

---

## 7. Acceptance Criteria by Module

### 7.1 Authentication Acceptance Criteria

| AC ID | Condition | Expected Result |
|---|---|---|
| **AC-AUTH-01** | User submits registration with all valid fields | User created, 201 response, activation email sent (if applicable) |
| | User submits registration with weak password (< 12 chars, no special chars) | 400 error, validation failure message listing missing requirements |
| | User submits registration with duplicate email | 409 Conflict error, "Email already registered" message |
| **AC-AUTH-02** | User submits valid credentials | 200 response with access token (15 min) and refresh token (7 days) |
| | User submits invalid password | 401 Unauthorized, "Invalid credentials" message |
| | User submits credentials for locked account | 423 Locked, "Account locked. Try again in X minutes" |
| **AC-AUTH-03** | User calls refresh endpoint with valid refresh token | 200 response with new access token |
| | User calls refresh endpoint with expired/revoked token | 401 Unauthorized, "Invalid refresh token" |
| **AC-AUTH-04** | Admin changes user role from TENANT to PROPERTY_MANAGER | Role updated immediately; user sees new permissions on next request |
| | Admin tries to delete the last ADMIN user | 422 error, "Cannot remove last administrator" |
| **AC-AUTH-05** | User requests password reset with valid email | 200 response; email sent with reset link (valid 1 hour) |
| | User submits new password that matches history | 422 error, "Cannot reuse last 5 passwords" |

### 7.2 Property Management Acceptance Criteria

| AC ID | Condition | Expected Result |
|---|---|---|
| **AC-PROP-01** | Manager creates property with all required fields | 201 response, property returned with generated ID, units list empty |
| | Manager creates property with missing required fields | 400 error, field-level validation errors |
| | Manager creates property with duplicate name + address | 409 Conflict error |
| **AC-PROP-02** | Manager adds 3 units to a property | 201 response, all 3 units returned with UNIQUE unit numbers, status = AVAILABLE |
| | Manager tries to add unit with duplicate number within same property | 409 error, "Unit number already exists" |
| **AC-PROP-03** | Manager changes unit status from AVAILABLE to MAINTENANCE | 200 response, status updated, unit excluded from available searches |
| **AC-PROP-04** | Manager searches by property name with partial match | Paginated results showing matching properties |
| | Manager filters by status=RENTED | Only properties with at least one RENTED unit returned |
| **AC-PROP-05** | Manager soft-deletes a property | Property marked deleted_at=now; no longer appears in search; existing leases remain intact |

### 7.3 Tenant Management Acceptance Criteria

| AC ID | Condition | Expected Result |
|---|---|---|
| **AC-TEN-01** | Manager creates tenant with all required fields | 201 response, tenant created with ID |
| | Manager creates tenant with invalid email format | 400 error, "Invalid email format" |
| **AC-TEN-02** | Manager views tenant with 2 past leases and 1 active lease | Profile shows personal info, lease timeline with dates, current lease highlighted |
| **AC-TEN-03** | Manager searches by partial email "john@" | All tenants with matching email pattern returned |
| **AC-TEN-04** | Tenant views their own profile | Profile information displayed in read-only mode (edit disabled) |
| | Tenant tries to view another tenant's profile | 403 Forbidden response |

### 7.4 Lease Management Acceptance Criteria

| AC ID | Condition | Expected Result |
|---|---|---|
| **AC-LEASE-01** | Manager creates lease with valid tenant, unit, date range (01-Jan-2026 to 31-Dec-2026), $1500/month rent | 201 response, lease created; unit status → RENTED; tenant marked as active |
| | Manager creates lease with end date before start date | 422 error, "End date must be after start date" |
| **AC-LEASE-02** | Manager tries to create a second lease for same unit with overlapping dates (01-Jun-2026 to 31-Aug-2026) | 409 error, "Unit is already leased during this period" |
| **AC-LEASE-03** | Manager renews a lease ending 31-Dec-2026 with new end date 31-Dec-2027, rent $1600/month | Old lease end date unchanged; new lease created starting 01-Jan-2027 |
| **AC-LEASE-04** | Manager terminates lease early with tenant moving out 30-Jun-2026, penalty $500 | Lease end date updated to 30-Jun-2026; penalty invoice generated |
| **AC-LEASE-05** | System runs daily check for leases expiring in 30 days | Notification/alerts generated for each lease; dashboard badge updated |

### 7.5 Rent Collection Acceptance Criteria

| AC ID | Condition | Expected Result |
|---|---|---|
| **AC-RENT-01** | System creates invoices for 10 active leases on the 1st of the month | 10 invoices created with status PENDING, due date 5th of month, amounts matching rent schedules |
| **AC-RENT-02** | Tenant views invoices for their lease | List of invoices with status, amount, due date; PAID invoices show payment reference |
| **AC-RENT-03** | Manager records $1500 payment against $1500 invoice | Invoice status → PAID; payment added to ledger; receipt generated; tenant balance = $0 |
| | Manager records $1000 partial payment against $1500 invoice | Invoice status → PARTIALLY_PAID; remaining balance = $500 |
| **AC-RENT-04** | System runs late fee check on day 10 (grace period = 5 days, fee = 5%/month, cap = $75) | $75 late fee applied to overdue invoices |
| **AC-RENT-05** | Manager views aging report | Invoices grouped by 0-30, 31-60, 61-90, 90+ buckets with total amounts |
| **AC-RENT-06** | System runs reminder check for invoices due in 7 days | Email notification sent; dashboard badge updated |

### 7.6 Maintenance Acceptance Criteria

| AC ID | Condition | Expected Result |
|---|---|---|
| **AC-MAINT-01** | Tenant creates ticket with URGENT priority for water leak | 201 response; ticket status = OPEN; SLA timer starts; manager notified |
| **AC-MAINT-02** | Manager assigns ticket to vendor "ABC Plumbing" | Ticket status → ASSIGNED; assignee = "ABC Plumbing"; vendor notified |
| **AC-MAINT-03** | Vendor marks ticket as IN_PROGRESS, then later as RESOLVED | Status transitions visible in ticket timeline; tenant notified on each change |
| | Vendor tries to mark ticket as CLOSED without prior RESOLVED status | 422 error, "Invalid state transition. Must be RESOLVED before CLOSED" |
| **AC-MAINT-04** | URGENT ticket not assigned within 4 hours of creation | System generates escalation alert; manager's supervisor notified |
| **AC-MAINT-05** | Manager views open tickets filtered by priority=HIGH and status=OPEN | Filtered results with relevant tickets sorted by created date descending |
| **AC-MAINT-06** | Tenant adds comment to their ticket with text and image attachment | Comment appended to ticket thread; assignee notified |

### 7.7 Dashboard Acceptance Criteria

| AC ID | Condition | Expected Result |
|---|---|---|
| **AC-DASH-01** | Property manager views dashboard | Occupancy card shows: 85% (17/20 units leased), trend vs last month |
| **AC-DASH-02** | Property manager views dashboard | Rent card shows: $42,500 collected MTD, $5,000 outstanding, 89.5% collection rate |
| **AC-DASH-03** | Property manager views dashboard | Maintenance card shows: 12 open tickets, avg resolution 18h, 3 breached SLAs (red alert) |
| **AC-DASH-04** | Property manager views dashboard | Lease expiry card shows: 2 leases expiring in 30 days, 5 in 60 days, 8 in 90 days |
| **AC-DASH-05** | Tenant logs in and navigates to dashboard | Tenant sees: their lease end date, current invoice status, open tickets count, next payment due date |

---

## 8. Assumptions & Dependencies

### 8.1 Assumptions

| # | Assumption | Impact if Invalid |
|---|---|---|
| A-01 | All users have access to email for account verification and notifications | Alternative notification channels would be required |
| A-02 | Property managers enter accurate data (addresses, rent amounts, dates) | System accuracy depends on input quality; audit trail maintains accountability |
| A-03 | The system is deployed in a trusted data center with regular backups | Data loss risk if backup strategy is inadequate |
| A-04 | Payment processing is manual (recorded by manager) in MVP; online payment gateway is future scope | No automatic payment reconciliation |
| A-05 | Tenant self-service is limited to view-only and ticket creation in MVP | Full self-service portal is out of scope for v1 |
| A-06 | The system operates in a single timezone (configurable) initially | Multi-timezone support needed for global portfolios |
| A-07 | Lease documents are pre-existing PDFs uploaded by managers; no in-system generation | Document generation is v2 scope |

### 8.2 Dependencies

| # | Dependency | Notes |
|---|---|---|
| D-01 | Java 17+ Runtime | Target JDK 17 LTS; system will not run on earlier versions |
| D-02 | PostgreSQL 16+ Database | Required for primary data store; not compatible with other RDBMS without migration |
| D-03 | MongoDB 7+ Database | Required for audit logs and ticket conversations |
| D-04 | SMTP Server / Email Service | Required for password reset, notifications, and reminders |
| D-05 | Maven 3.9+ for build | Build tool; CI/CD pipeline must have Maven installed |
| D-06 | Docker (optional for local dev) | Docker Compose for local PostgreSQL + MongoDB instances |

---

## 9. Out of Scope

The following capabilities are explicitly **out of scope** for v1.0 and will be considered for future releases.

### 9.1 Functional Exclusions

| # | Feature | Rationale |
|---|---|---|
| OS-01 | **Online payment gateway integration** (Stripe, PayPal, etc.) | MVP uses manual payment recording; requires PCI compliance and third-party integration |
| OS-02 | **Automated lease document generation** with digital signatures | Lease documents are uploaded as PDFs by managers; template generation is complex |
| OS-03 | **Tenant self-service portal** (profile editing, online payments, document upload) | MVP focuses on manager workflows; tenant access is view-only |
| OS-04 | **Mobile native applications** (iOS/Android) | Responsive Bootstrap web UI serves all devices in v1 |
| OS-05 | **Automated rent escalation pro-rating** for mid-lease changes | Manual adjustment of rent schedules in MVP; full pro-ration is v2 |
| OS-06 | **Multi-currency support** | Single currency (configurable) for MVP |
| OS-07 | **Property marketing/public listings** (vacancy publishing to external sites) | Internal vacancy tracking only; external listing is a separate product |
| OS-08 | **Integration with accounting software** (QuickBooks, Xero) | Export reports as CSV/PDF for manual import |
| OS-09 | **Chat/messaging system** between tenants and managers | Communication via ticket comments + email notifications |
| OS-10 | **Automated tenant screening / credit checks** | Manual onboarding with document upload; third-party API integration is v2 |

### 9.2 Technical Exclusions

| # | Feature | Rationale |
|---|---|---|
| OS-11 | **Redis / external caching layer** | In-memory caching sufficient for MVP; Redis for distributed caching in production scale |
| OS-12 | **Microservices architecture** | Monolith with clean package boundaries; extract to services when team scales |
| OS-13 | **Kubernetes / container orchestration** | Docker Compose for MVP; K8s for production at scale |
| OS-14 | **CI/CD pipeline configuration** (Jenkins, GitHub Actions, etc.) | Team to configure separately; application provides Dockerfile and build scripts |
| OS-15 | **Infrastructure as Code** (Terraform, CloudFormation) | Deployment infrastructure is team responsibility |
| OS-16 | **Performance load testing suite** | Basic performance targets documented; formal load testing is operations responsibility |

---

## 10. Glossary

| Term | Definition |
|---|---|
| **Access Token** | Short-lived JWT token (15 min) used to authenticate API requests |
| **Aging Report** | Report showing unpaid invoices grouped by how overdue they are (0-30, 31-60, 61-90, 90+ days) |
| **Aggregate Root** | DDD concept — the root entity that guarantees consistency of related entities (e.g., Property is aggregate root for Units) |
| **BCrypt** | Password hashing algorithm with configurable work factor (cost) |
| **Clean Architecture** | Architectural pattern enforcing dependency inversion — domain layer has no external dependencies |
| **Delinquency** | State where an invoice is past its due date with outstanding balance |
| **Grace Period** | Number of days after the due date before late fees are applied |
| **JWT** | JSON Web Token — self-contained token format for transmitting claims between parties |
| **Lease** | Contract between property owner/manager and tenant defining rental terms, dates, and rent |
| **MDC** | Mapped Diagnostic Context — SLF4J feature for adding contextual information to log entries |
| **MTD** | Month-to-Date — financial metric calculated from the start of the current month |
| **MTTR** | Mean Time To Resolution — average time from ticket creation to resolution |
| **Optimistic Locking** | Concurrency control using version numbers; retry on conflict rather than locking rows |
| **PII** | Personally Identifiable Information — data requiring encryption at rest (e.g., government IDs, phone numbers) |
| **Refresh Token** | Long-lived token (7 days) stored in database, used to obtain new access tokens without re-authentication |
| **Rent Schedule** | Defines base rent, escalation clauses, discounts, and payment frequency for a lease |
| **Security Deposit** | Refundable amount held against damages or unpaid rent, tracked with ledger entries |
| **SLA** | Service Level Agreement — time targets for maintenance ticket resolution by priority level |
| **Soft Delete** | Marking a record as deleted (via `deleted_at` timestamp) rather than physically removing it |
| **Thymeleaf** | Java template engine for server-side HTML rendering, integrated with Spring Boot |
| **Value Object** | Immutable domain object defined by its attributes (e.g., Money, DateRange, Address) |

---

> *This requirements document is a living artifact. All changes must be reviewed and approved before implementation.*  
> *For architecture decisions and technical specifications, refer to [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).*
