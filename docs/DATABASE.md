# SmartLease — Database Design Document

> **PostgreSQL & MongoDB Schema Blueprint**  
> *Version 1.0* | *Last Updated: July 28, 2026*

---

## Table of Contents

1. [Database Strategy Overview](#1-database-strategy-overview)
2. [PostgreSQL — Relational Schema](#2-postgresql--relational-schema)
   - 2.1. Auth Module Tables
   - 2.2. Property Management Tables
   - 2.3. Tenant Management Tables
   - 2.4. Lease Management Tables
   - 2.5. Rent Collection Tables
   - 2.6. Maintenance Tickets Tables
   - 2.7. Enum Definitions
   - 2.8. PostgreSQL Views
3. [MongoDB — Document Schema](#3-mongodb--document-schema)
   - 3.1. Audit Logs Collection
   - 3.2. Ticket Comments Collection
   - 3.3. Notification Logs Collection
   - 3.4. Dashboard Snapshots Collection
   - 3.5. Session Events Collection
4. [Entity-Relationship Diagram](#4-entity-relationship-diagram)
5. [Primary Key Strategy](#5-primary-key-strategy)
6. [Foreign Key Relationships](#6-foreign-key-relationships)
7. [Index Strategy](#7-index-strategy)
8. [Normalization Analysis](#8-normalization-analysis)
9. [Naming Conventions](#9-naming-conventions)
10. [Migration Strategy](#10-migration-strategy)

---

## 1. Database Strategy Overview

### 1.1 Database Responsibility Split

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     SMARTLEASE DATABASE STRATEGY                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   PostgreSQL 16                         MongoDB 7                         │
│   ───────────────────                   ───────────                       │
│                                                                           │
│   PURPOSE:                              PURPOSE:                          │
│   • Transactional (ACID) data           • Append-heavy, write-once data   │
│   • Strong consistency required         • Schema-flexible workloads       │
│   • Complex joins & reporting           • Unbounded collections           │
│   • Referential integrity               • High-write throughput           │
│                                                                           │
│   WHAT GOES IN POSTGRESQL:              WHAT GOES IN MONGODB:             │
│   • Users, roles, permissions           • Audit trails (immutable)        │
│   • Properties, units                   • Ticket conversations            │
│   • Tenants, contacts                   • Notification delivery logs      │
│   • Leases, rent schedules              • Pre-computed dashboard cache    │
│   • Invoices, payments, ledger          • Session/activity events         │
│   • Maintenance tickets, vendors        • Tenant documents (GridFS)       │
│   • SLA policies                        • Large text content              │
│                                                                           │
│   RELATIONSHIP:                        RELATIONSHIP:                      │
│   • Has FK references to both DBs      • References PostgreSQL IDs        │
│   • Primary source of truth            • Complementary, not primary       │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Cross-Database Reference Pattern

```
┌───────────────┐            ┌───────────────┐
│   PostgreSQL   │            │    MongoDB     │
│   (Primary)    │            │  (Secondary)   │
├───────────────┤            ├───────────────┤
│  leases.id     │◄──────────│  invoice.id    │
│  = 12345       │  ref in   │  = 12345       │
│                │  document │                │
│                │           │  audit_logs:   │
│                │           │  {             │
│                │           │    resourceId: │
│                │           │    "lease:12345"│
│                │           │  }             │
└───────────────┘            └───────────────┘

Note: MongoDB documents reference PostgreSQL IDs as STRING values.
There are NO formal foreign keys from MongoDB → PostgreSQL.
Referential integrity is maintained at the APPLICATION layer.
```

### 1.3 Schema Migration Strategy

```
PostgreSQL: Flyway (versioned migrations)
────────────────────────────────────────
  • V1__init_schema.sql       - All tables, enums, indexes
  • V2__seed_roles.sql        - Default roles & permissions
  • V3__seed_admin_user.sql   - Default admin account
  • V4__add_property_images   - New table (additive only)
  • V5__alter_invoices_add_   - Safe column addition
    escalation_ref

  Rules:
  • Migrations are immutable once applied (never edit!)
  • New migrations are always additive
  • rollback via V__undo scripts (separate)
  • No DDL in application code

MongoDB: Spring Data MongoDB (code-first)
───────────────────────────────────────────
  • Collections are created on first write
  • Indexes defined via @Indexed annotation on repository
  • Seed data via MongoTemplate in ApplicationRunner
  • Schema validation via JSON Schema validator (optional)
```

---

## 2. PostgreSQL — Relational Schema

### 2.1 Auth Module Tables

#### Table: `users`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | Auto-increment user ID |
| `email` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | Login email (lowercased) |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | BCrypt hash (cost=12) |
| `first_name` | `VARCHAR(100)` | `NOT NULL` | User's first name |
| `last_name` | `VARCHAR(100)` | `NOT NULL` | User's last name |
| `phone` | `VARCHAR(20)` | `NULL` | Contact phone (encrypted at rest) |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'ACTIVE'` | ACTIVE, LOCKED, DISABLED, PENDING_VERIFICATION |
| `failed_login_attempts` | `INTEGER` | `NOT NULL, DEFAULT 0` | Consecutive failed logins |
| `locked_until` | `TIMESTAMP` | `NULL` | NULL = not locked; future = lock expiry |
| `last_login_at` | `TIMESTAMP` | `NULL` | Last successful login timestamp |
| `password_changed_at` | `TIMESTAMP` | `NOT NULL` | When password was last changed |
| `deleted_at` | `TIMESTAMP` | `NULL` | Soft-delete timestamp |
| `deleted_by` | `BIGINT` | `NULL, FK → users.id` | Who deleted this user |
| `version` | `INTEGER` | `NOT NULL, DEFAULT 0` | Optimistic lock version |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Row creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Row last update timestamp |
| `created_by` | `BIGINT` | `NULL, FK → users.id` | Who created this row |
| `updated_by` | `BIGINT` | `NULL, FK → users.id` | Who last updated this row |

> **Indexes:** See [Section 7 — Index Strategy](#7-index-strategy)

#### Table: `roles`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | Auto-increment role ID |
| `name` | `VARCHAR(50)` | `NOT NULL, UNIQUE` | ADMIN, PROPERTY_MANAGER, TENANT, VENDOR, VIEWER |
| `description` | `VARCHAR(255)` | `NULL` | Human-readable description |
| `is_system` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | System role (cannot be deleted) |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |

#### Table: `user_roles`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `user_id` | `BIGINT` | `NOT NULL, FK → users.id` | Reference to user |
| `role_id` | `BIGINT` | `NOT NULL, FK → roles.id` | Reference to role |
| `assigned_by` | `BIGINT` | `NULL, FK → users.id` | Who assigned this role |
| `assigned_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | When role was assigned |

> **Unique constraint:** `(user_id, role_id)` — a user can have a role only once

#### Table: `refresh_tokens`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `user_id` | `BIGINT` | `NOT NULL, FK → users.id` | Token owner |
| `token` | `UUID` | `NOT NULL, UNIQUE` | The refresh token value |
| `expires_at` | `TIMESTAMP` | `NOT NULL` | Token expiration (now + 7 days) |
| `revoked` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Whether token has been revoked |
| `revoked_at` | `TIMESTAMP` | `NULL` | When token was revoked |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |

> **Index:** `(user_id, revoked)` for active token lookups

#### Table: `password_history`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `user_id` | `BIGINT` | `NOT NULL, FK → users.id` | |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Previous password hash |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |

> **Index:** `(user_id, created_at DESC)` — last 5 passwords per user

---

### 2.2 Property Management Tables

#### Table: `properties`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `name` | `VARCHAR(200)` | `NOT NULL` | Property name (e.g., "Oakwood Apartments") |
| `type` | `VARCHAR(20)` | `NOT NULL` | RESIDENTIAL, COMMERCIAL, MIXED_USE |
| `description` | `TEXT` | `NULL` | Free-text description |
| `address_line1` | `VARCHAR(255)` | `NOT NULL` | Street address |
| `address_line2` | `VARCHAR(255)` | `NULL` | Suite/floor/building |
| `city` | `VARCHAR(100)` | `NOT NULL` | |
| `state` | `VARCHAR(50)` | `NOT NULL` | State/province code |
| `postal_code` | `VARCHAR(20)` | `NOT NULL` | |
| `country` | `VARCHAR(50)` | `NOT NULL, DEFAULT 'US'` | ISO country code |
| `latitude` | `DECIMAL(10,7)` | `NULL` | Geolocation lat |
| `longitude` | `DECIMAL(10,7)` | `NULL` | Geolocation lng |
| `manager_id` | `BIGINT` | `NOT NULL, FK → users.id` | Assigned property manager |
| `attributes` | `JSONB` | `NOT NULL, DEFAULT '{}'` | Flexible key-value attributes |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'ACTIVE'` | ACTIVE, INACTIVE, UNDER_RENOVATION |
| `deleted_at` | `TIMESTAMP` | `NULL` | Soft-delete timestamp |
| `deleted_by` | `BIGINT` | `NULL, FK → users.id` | |
| `version` | `INTEGER` | `NOT NULL, DEFAULT 0` | |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `created_by` | `BIGINT` | `NULL, FK → users.id` | |
| `updated_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Indexes:** `(manager_id)`, `(status, deleted_at)`, GIN `(attributes)`

#### Table: `units`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `property_id` | `BIGINT` | `NOT NULL, FK → properties.id` | Parent property |
| `unit_number` | `VARCHAR(50)` | `NOT NULL` | Apartment/unit number |
| `floor` | `INTEGER` | `NULL` | Floor level |
| `bedrooms` | `INTEGER` | `NOT NULL, DEFAULT 1` | Number of bedrooms |
| `bathrooms` | `DECIMAL(3,1)` | `NOT NULL, DEFAULT 1.0` | Number of bathrooms (e.g., 1.5) |
| `square_feet` | `INTEGER` | `NULL` | Square footage |
| `monthly_rent` | `DECIMAL(10,2)` | `NOT NULL` | Current base monthly rent |
| `security_deposit` | `DECIMAL(10,2)` | `NULL` | Standard deposit for this unit |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'AVAILABLE'` | AVAILABLE, RENTED, MAINTENANCE, RESERVED, UNAVAILABLE |
| `attributes` | `JSONB` | `NOT NULL, DEFAULT '{}'` | Flexible unit attributes |
| `deleted_at` | `TIMESTAMP` | `NULL` | |
| `deleted_by` | `BIGINT` | `NULL, FK → users.id` | |
| `version` | `INTEGER` | `NOT NULL, DEFAULT 0` | |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `created_by` | `BIGINT` | `NULL, FK → users.id` | |
| `updated_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Unique constraint:** `(property_id, unit_number)` — no duplicate unit numbers within a property
>
> **Indexes:** `(property_id, status)`, `(status, deleted_at)`

#### Table: `property_images`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `property_id` | `BIGINT` | `NOT NULL, FK → properties.id` | |
| `filename` | `VARCHAR(255)` | `NOT NULL` | Original filename |
| `file_path` | `VARCHAR(500)` | `NOT NULL` | Storage path/URL |
| `file_size` | `INTEGER` | `NOT NULL` | Size in bytes |
| `content_type` | `VARCHAR(100)` | `NOT NULL` | MIME type |
| `is_primary` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Primary/cover image |
| `sort_order` | `INTEGER` | `NOT NULL, DEFAULT 0` | Display order |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `created_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Index:** `(property_id, sort_order)`

---

### 2.3 Tenant Management Tables

#### Table: `tenants`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `first_name` | `VARCHAR(100)` | `NOT NULL` | |
| `last_name` | `VARCHAR(100)` | `NOT NULL` | |
| `email` | `VARCHAR(255)` | `NOT NULL` | Contact email (not necessarily login) |
| `phone` | `VARCHAR(20)` | `NULL` | Encrypted at rest |
| `emergency_contact_name` | `VARCHAR(200)` | `NULL` | Encrypted at rest |
| `emergency_contact_phone` | `VARCHAR(20)` | `NULL` | Encrypted at rest |
| `government_id_type` | `VARCHAR(30)` | `NULL` | PASSPORT, DRIVERS_LICENSE, SSN, OTHER |
| `government_id_number` | `VARCHAR(100)` | `NULL` | Encrypted at rest |
| `date_of_birth` | `DATE` | `NULL` | |
| `employer` | `VARCHAR(200)` | `NULL` | Current employer |
| `annual_income` | `DECIMAL(12,2)` | `NULL` | Self-reported annual income |
| `notes` | `TEXT` | `NULL` | Internal notes |
| `preferred_contact_method` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'EMAIL'` | EMAIL, SMS, PHONE |
| `preferred_language` | `VARCHAR(10)` | `NOT NULL, DEFAULT 'en'` | ISO language code |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'ACTIVE'` | ACTIVE, INACTIVE, FORMER, BLACKLISTED |
| `deleted_at` | `TIMESTAMP` | `NULL` | |
| `deleted_by` | `BIGINT` | `NULL, FK → users.id` | |
| `version` | `INTEGER` | `NOT NULL, DEFAULT 0` | |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `created_by` | `BIGINT` | `NULL, FK → users.id` | |
| `updated_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Indexes:** `(email)`, `(phone)` where NOT NULL, `(status, deleted_at)`

#### Table: `tenant_contacts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `tenant_id` | `BIGINT` | `NOT NULL, FK → tenants.id` | |
| `contact_type` | `VARCHAR(20)` | `NOT NULL` | EMAIL, PHONE, EMERGENCY, REFERENCE |
| `value` | `VARCHAR(255)` | `NOT NULL` | The actual contact value |
| `is_primary` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | |
| `notes` | `VARCHAR(255)` | `NULL` | |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |

> **Index:** `(tenant_id, contact_type)`

#### Table: `tenant_documents_metadata`

Metadata for documents stored in MongoDB GridFS.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `tenant_id` | `BIGINT` | `NOT NULL, FK → tenants.id` | |
| `gridfs_id` | `VARCHAR(100)` | `NOT NULL, UNIQUE` | MongoDB GridFS file ID |
| `document_type` | `VARCHAR(30)` | `NOT NULL` | LEASE_AGREEMENT, ID_PROOF, INCOME_PROOF, OTHER |
| `filename` | `VARCHAR(255)` | `NOT NULL` | Original filename |
| `file_size` | `INTEGER` | `NOT NULL` | Size in bytes |
| `content_type` | `VARCHAR(100)` | `NOT NULL` | MIME type |
| `uploaded_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `uploaded_by` | `BIGINT` | `NOT NULL, FK → users.id` | |

> **Index:** `(tenant_id, document_type)`

---

### 2.4 Lease Management Tables

#### Table: `leases`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `lease_number` | `VARCHAR(50)` | `NOT NULL, UNIQUE` | Human-readable reference (e.g., "LS-2026-00042") |
| `property_id` | `BIGINT` | `NOT NULL, FK → properties.id` | Denormalized for query performance |
| `unit_id` | `BIGINT` | `NOT NULL, FK → units.id` | The rented unit |
| `tenant_id` | `BIGINT` | `NOT NULL, FK → tenants.id` | Primary tenant |
| `co_tenants` | `JSONB` | `NOT NULL, DEFAULT '[]'` | Array of co-tenant IDs (flexible) |
| `start_date` | `DATE` | `NOT NULL` | Lease start |
| `end_date` | `DATE` | `NOT NULL` | Lease end |
| `termination_date` | `DATE` | `NULL` | If terminated early |
| `termination_reason` | `VARCHAR(255)` | `NULL` | Reason for early termination |
| `termination_penalty` | `DECIMAL(10,2)` | `NULL` | Early termination fee |
| `base_rent` | `DECIMAL(10,2)` | `NOT NULL` | Monthly base rent at signing |
| `security_deposit` | `DECIMAL(10,2)` | `NOT NULL` | Security deposit amount |
| `rent_due_day` | `INTEGER` | `NOT NULL, DEFAULT 1` | Day of month rent is due |
| `payment_frequency` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'MONTHLY'` | MONTHLY, QUARTERLY, BI_ANNUALLY, ANNUALLY |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'DRAFT'` | DRAFT, ACTIVE, EXPIRED, TERMINATED, RENEWED |
| `terms_conditions` | `TEXT` | `NULL` | Free-text terms |
| `notes` | `TEXT` | `NULL` | Internal notes |
| `deleted_at` | `TIMESTAMP` | `NULL` | |
| `deleted_by` | `BIGINT` | `NULL, FK → users.id` | |
| `version` | `INTEGER` | `NOT NULL, DEFAULT 0` | Optimistic lock |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `created_by` | `BIGINT` | `NULL, FK → users.id` | |
| `updated_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Indexes:** `(unit_id, status)`, `(tenant_id, status)`, `(status, end_date)`, `(property_id, status)`

#### Table: `rent_schedules`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `lease_id` | `BIGINT` | `NOT NULL, FK → leases.id` | |
| `effective_from` | `DATE` | `NOT NULL` | When this rent takes effect |
| `effective_to` | `DATE` | `NULL` | When this rent ends (NULL = current) |
| `base_rent` | `DECIMAL(10,2)` | `NOT NULL` | Monthly rent for this period |
| `escalation_percentage` | `DECIMAL(5,2)` | `NULL` | e.g., 3.00 for 3% |
| `escalation_frequency_months` | `INTEGER` | `NULL` | e.g., 12 for annual escalation |
| `discount_percentage` | `DECIMAL(5,2)` | `NULL` | Promotional discount |
| `discount_description` | `VARCHAR(255)` | `NULL` | e.g., "First month free" |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `created_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Unique constraint:** `(lease_id, effective_from)` — no two schedules start on same date
>
> **Index:** `(lease_id, is_active)`

#### Table: `security_deposit_ledger`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `lease_id` | `BIGINT` | `NOT NULL, FK → leases.id` | |
| `entry_type` | `VARCHAR(20)` | `NOT NULL` | DEPOSIT, DEDUCTION, REFUND, ADJUSTMENT |
| `amount` | `DECIMAL(10,2)` | `NOT NULL` | Positive for deposit/refund, negative for deductions |
| `balance_after` | `DECIMAL(10,2)` | `NOT NULL` | Running balance |
| `description` | `VARCHAR(255)` | `NOT NULL` | Reason for entry |
| `reference_invoice_id` | `BIGINT` | `NULL, FK → invoices.id` | If related to an invoice |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `created_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Index:** `(lease_id, created_at)`

---

### 2.5 Rent Collection Tables

#### Table: `invoices`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `invoice_number` | `VARCHAR(50)` | `NOT NULL, UNIQUE` | Human-readable (e.g., "INV-2026-08-00123") |
| `lease_id` | `BIGINT` | `NOT NULL, FK → leases.id` | Parent lease |
| `unit_id` | `BIGINT` | `NOT NULL, FK → units.id` | Denormalized for reporting |
| `tenant_id` | `BIGINT` | `NOT NULL, FK → tenants.id` | Denormalized for reporting |
| `period_start` | `DATE` | `NOT NULL` | Billing period start |
| `period_end` | `DATE` | `NOT NULL` | Billing period end |
| `due_date` | `DATE` | `NOT NULL` | Payment due date |
| `base_amount` | `DECIMAL(10,2)` | `NOT NULL` | Base rent amount |
| `late_fee_amount` | `DECIMAL(10,2)` | `NOT NULL, DEFAULT 0.00` | Applied late fee |
| `discount_amount` | `DECIMAL(10,2)` | `NOT NULL, DEFAULT 0.00` | Applied discount |
| `adjustment_amount` | `DECIMAL(10,2)` | `NOT NULL, DEFAULT 0.00` | Manual adjustment |
| `total_amount` | `DECIMAL(10,2)` | `NOT NULL` | Computed: base + late_fee - discount + adjustment |
| `paid_amount` | `DECIMAL(10,2)` | `NOT NULL, DEFAULT 0.00` | Amount paid so far |
| `balance_due` | `DECIMAL(10,2)` | `NOT NULL` | total_amount - paid_amount |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'PENDING'` | PENDING, PARTIALLY_PAID, PAID, OVERPAID, CANCELLED, REFUNDED |
| `notes` | `TEXT` | `NULL` | |
| `version` | `INTEGER` | `NOT NULL, DEFAULT 0` | Optimistic lock |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `created_by` | `BIGINT` | `NULL, FK → users.id` | |
| `updated_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Indexes:** `(lease_id, period_start)`, `(tenant_id, status)`, `(unit_id, status)`, `(status, due_date)`, `(due_date)` — critical for delinquency queries
>
> **Computed columns (application logic):**
> - `total_amount = base_amount + late_fee_amount - discount_amount + adjustment_amount`
> - `balance_due = total_amount - paid_amount`

#### Table: `payments`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `payment_number` | `VARCHAR(50)` | `NOT NULL, UNIQUE` | Human-readable reference |
| `invoice_id` | `BIGINT` | `NOT NULL, FK → invoices.id` | The invoice being paid |
| `tenant_id` | `BIGINT` | `NOT NULL, FK → tenants.id` | Denormalized |
| `amount` | `DECIMAL(10,2)` | `NOT NULL` | Payment amount |
| `payment_date` | `DATE` | `NOT NULL` | When payment occurred |
| `payment_method` | `VARCHAR(30)` | `NOT NULL` | CASH, CHECK, BANK_TRANSFER, CREDIT_CARD, ONLINE |
| `reference_number` | `VARCHAR(100)` | `NULL` | Check number, transaction ID, etc. |
| `notes` | `VARCHAR(255)` | `NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'COMPLETED'` | COMPLETED, PENDING, FAILED, REFUNDED, VOID |
| `reconciled` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Has been reconciled with bank |
| `reconciled_at` | `TIMESTAMP` | `NULL` | |
| `reconciled_by` | `BIGINT` | `NULL, FK → users.id` | |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `created_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Indexes:** `(invoice_id)`, `(tenant_id, payment_date)`, `(payment_method)`, `(status)`

#### Table: `payment_ledger`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `payment_id` | `BIGINT` | `NOT NULL, FK → payments.id` | |
| `invoice_id` | `BIGINT` | `NOT NULL, FK → invoices.id` | |
| `entry_type` | `VARCHAR(20)` | `NOT NULL` | PAYMENT, REFUND, VOID, ADJUSTMENT |
| `amount` | `DECIMAL(10,2)` | `NOT NULL` | |
| `invoice_balance_before` | `DECIMAL(10,2)` | `NOT NULL` | Invoice balance before this entry |
| `invoice_balance_after` | `DECIMAL(10,2)` | `NOT NULL` | Invoice balance after this entry |
| `description` | `VARCHAR(255)` | `NULL` | |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `created_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Index:** `(invoice_id, created_at)`

#### Table: `receipts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `receipt_number` | `VARCHAR(50)` | `NOT NULL, UNIQUE` | Human-readable reference |
| `payment_id` | `BIGINT` | `NOT NULL, FK → payments.id` | |
| `invoice_id` | `BIGINT` | `NOT NULL, FK → invoices.id` | |
| `tenant_id` | `BIGINT` | `NOT NULL, FK → tenants.id` | |
| `receipt_data` | `JSONB` | `NOT NULL` | Full receipt breakdown (amount, method, dates, etc.) |
| `generated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `generated_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Index:** `(payment_id)`, `(tenant_id, generated_at DESC)`

#### Table: `late_fee_rules`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `name` | `VARCHAR(100)` | `NOT NULL, UNIQUE` | Rule name |
| `grace_period_days` | `INTEGER` | `NOT NULL, DEFAULT 5` | Days after due date before fees apply |
| `fee_type` | `VARCHAR(20)` | `NOT NULL` | PERCENTAGE, FLAT_FEE, PERCENTAGE_WITH_CAP |
| `fee_value` | `DECIMAL(10,2)` | `NOT NULL` | Percentage (e.g., 5.00) or flat amount (e.g., 50.00) |
| `fee_cap` | `DECIMAL(10,2)` | `NULL` | Maximum late fee (for percentage with cap) |
| `recurrence` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'ONE_TIME'` | ONE_TIME, DAILY, WEEKLY, MONTHLY |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |

> **Seed data:** One default rule: 5-day grace, 5% monthly fee, $75 cap, ONE_TIME recurrence

---

### 2.6 Maintenance Tickets Tables

#### Table: `vendors`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `name` | `VARCHAR(200)` | `NOT NULL` | Company name |
| `contact_name` | `VARCHAR(200)` | `NULL` | Primary contact |
| `email` | `VARCHAR(255)` | `NULL` | |
| `phone` | `VARCHAR(20)` | `NULL` | |
| `trade_specialty` | `VARCHAR(100)` | `NULL` | PLUMBING, ELECTRICAL, HVAC, GENERAL, LANDSCAPING, etc. |
| `hourly_rate` | `DECIMAL(10,2)` | `NULL` | Standard hourly rate |
| `insurance_proof` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Has valid insurance on file |
| `rating` | `DECIMAL(2,1)` | `NULL` | 1.0–5.0 rating |
| `notes` | `TEXT` | `NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'ACTIVE'` | ACTIVE, INACTIVE, BLACKLISTED |
| `deleted_at` | `TIMESTAMP` | `NULL` | |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `created_by` | `BIGINT` | `NULL, FK → users.id` | |
| `updated_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Index:** `(trade_specialty, status)`

#### Table: `tickets`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `ticket_number` | `VARCHAR(50)` | `NOT NULL, UNIQUE` | Human-readable (e.g., "TK-2026-00189") |
| `unit_id` | `BIGINT` | `NOT NULL, FK → units.id` | Unit needing repair |
| `property_id` | `BIGINT` | `NOT NULL, FK → properties.id` | Denormalized |
| `reporter_id` | `BIGINT` | `NOT NULL, FK → users.id` | Who reported (usually tenant) |
| `assignee_id` | `BIGINT` | `NULL, FK → users.id` | Who is assigned (can be vendor) |
| `vendor_id` | `BIGINT` | `NULL, FK → vendors.id` | External vendor (if applicable) |
| `title` | `VARCHAR(200)` | `NOT NULL` | Short description |
| `description` | `TEXT` | `NOT NULL` | Detailed description |
| `category` | `VARCHAR(50)` | `NOT NULL` | PLUMBING, ELECTRICAL, HVAC, APPLIANCE, STRUCTURAL, PEST, OTHER |
| `priority` | `VARCHAR(10)` | `NOT NULL` | LOW, MEDIUM, HIGH, URGENT |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'OPEN'` | OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REOPENED |
| `sla_deadline` | `TIMESTAMP` | `NULL` | Computed based on priority at creation |
| `sla_breached` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Flagged when SLA missed |
| `sla_breached_at` | `TIMESTAMP` | `NULL` | When SLA was breached |
| `resolved_at` | `TIMESTAMP` | `NULL` | When status → RESOLVED |
| `closed_at` | `TIMESTAMP` | `NULL` | When status → CLOSED |
| `resolution_notes` | `TEXT` | `NULL` | How it was fixed |
| `cost` | `DECIMAL(10,2)` | `NULL` | Total cost of repair |
| `deleted_at` | `TIMESTAMP` | `NULL` | |
| `version` | `INTEGER` | `NOT NULL, DEFAULT 0` | |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `created_by` | `BIGINT` | `NULL, FK → users.id` | |
| `updated_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Indexes:** `(unit_id, status)`, `(property_id, status)`, `(assignee_id, status)`, `(priority, status)`, `(status, sla_breached)`, `(created_at DESC)`

#### Table: `ticket_assignments`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `ticket_id` | `BIGINT` | `NOT NULL, FK → tickets.id` | |
| `assigned_to` | `BIGINT` | `NOT NULL, FK → users.id` | User being assigned |
| `assigned_by` | `BIGINT` | `NOT NULL, FK → users.id` | Manager who assigned |
| `assignment_note` | `VARCHAR(500)` | `NULL` | Instructions for assignee |
| `assigned_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |

> **Index:** `(ticket_id, assigned_at DESC)`

#### Table: `ticket_attachments`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `ticket_id` | `BIGINT` | `NOT NULL, FK → tickets.id` | |
| `filename` | `VARCHAR(255)` | `NOT NULL` | |
| `file_path` | `VARCHAR(500)` | `NOT NULL` | |
| `file_size` | `INTEGER` | `NOT NULL` | |
| `content_type` | `VARCHAR(100)` | `NOT NULL` | |
| `uploaded_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `uploaded_by` | `BIGINT` | `NULL, FK → users.id` | |

> **Index:** `(ticket_id)`

#### Table: `sla_policies`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `priority` | `VARCHAR(10)` | `NOT NULL, UNIQUE` | LOW, MEDIUM, HIGH, URGENT |
| `response_time_hours` | `INTEGER` | `NOT NULL` | Max hours to first response |
| `resolution_time_hours` | `INTEGER` | `NOT NULL` | Max hours to resolution |
| `escalation_after_hours` | `INTEGER` | `NULL` | Auto-escalate if not resolved |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | |

> **Seed data:**
> | Priority | Response | Resolution | Escalate |
> |---|---|---|---|
> | LOW | 24h | 120h (5 days) | 168h |
> | MEDIUM | 8h | 72h (3 days) | 96h |
> | HIGH | 4h | 24h (1 day) | 48h |
> | URGENT | 1h | 4h | 8h |

---

### 2.7 Enum Definitions

All enums stored as `VARCHAR` in PostgreSQL (not native PG enum).

```sql
-- User status
CREATE DOMAIN user_status AS VARCHAR(20)
    CHECK (VALUE IN ('ACTIVE', 'LOCKED', 'DISABLED', 'PENDING_VERIFICATION'));

-- Property type
CREATE DOMAIN property_type AS VARCHAR(20)
    CHECK (VALUE IN ('RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE'));

-- Property status
CREATE DOMAIN property_status AS VARCHAR(20)
    CHECK (VALUE IN ('ACTIVE', 'INACTIVE', 'UNDER_RENOVATION'));

-- Unit status
CREATE DOMAIN unit_status AS VARCHAR(20)
    CHECK (VALUE IN ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'RESERVED', 'UNAVAILABLE'));

-- Lease status
CREATE DOMAIN lease_status AS VARCHAR(20)
    CHECK (VALUE IN ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED'));

-- Invoice status
CREATE DOMAIN invoice_status AS VARCHAR(20)
    CHECK (VALUE IN ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERPAID', 'CANCELLED', 'REFUNDED'));

-- Payment status
CREATE DOMAIN payment_status AS VARCHAR(20)
    CHECK (VALUE IN ('COMPLETED', 'PENDING', 'FAILED', 'REFUNDED', 'VOID'));

-- Payment method
CREATE DOMAIN payment_method AS VARCHAR(30)
    CHECK (VALUE IN ('CASH', 'CHECK', 'BANK_TRANSFER', 'CREDIT_CARD', 'ONLINE'));

-- Ticket status
CREATE DOMAIN ticket_status AS VARCHAR(20)
    CHECK (VALUE IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'));

-- Ticket priority
CREATE DOMAIN ticket_priority AS VARCHAR(10)
    CHECK (VALUE IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'));

-- Tenant status
CREATE DOMAIN tenant_status AS VARCHAR(20)
    CHECK (VALUE IN ('ACTIVE', 'INACTIVE', 'FORMER', 'BLACKLISTED'));

-- Vendor status
CREATE DOMAIN vendor_status AS VARCHAR(20)
    CHECK (VALUE IN ('ACTIVE', 'INACTIVE', 'BLACKLISTED'));

-- Document type
CREATE DOMAIN document_type AS VARCHAR(30)
    CHECK (VALUE IN ('LEASE_AGREEMENT', 'ID_PROOF', 'INCOME_PROOF', 'OTHER'));

-- Deposit ledger entry type
CREATE DOMAIN deposit_entry_type AS VARCHAR(20)
    CHECK (VALUE IN ('DEPOSIT', 'DEDUCTION', 'REFUND', 'ADJUSTMENT'));

-- Payment ledger entry type
CREATE DOMAIN ledger_entry_type AS VARCHAR(20)
    CHECK (VALUE IN ('PAYMENT', 'REFUND', 'VOID', 'ADJUSTMENT'));
```

---

### 2.8 PostgreSQL Views

#### View: `vw_dashboard_occupancy`

```sql
CREATE VIEW vw_dashboard_occupancy AS
SELECT
    p.id AS property_id,
    p.name AS property_name,
    COUNT(u.id) AS total_units,
    COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') AS available_units,
    COUNT(u.id) FILTER (WHERE u.status = 'RENTED') AS rented_units,
    COUNT(u.id) FILTER (WHERE u.status = 'MAINTENANCE') AS maintenance_units,
    ROUND(
        100.0 * COUNT(u.id) FILTER (WHERE u.status = 'RENTED') / NULLIF(COUNT(u.id), 0),
        1
    ) AS occupancy_percentage
FROM properties p
JOIN units u ON u.property_id = p.id AND u.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name;
```

#### View: `vw_dashboard_financial_summary`

```sql
CREATE VIEW vw_dashboard_financial_summary AS
SELECT
    l.property_id,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status IN ('PENDING', 'PARTIALLY_PAID')) AS outstanding_invoices,
    COALESCE(SUM(i.balance_due) FILTER (WHERE i.status IN ('PENDING', 'PARTIALLY_PAID')), 0) AS total_outstanding,
    COALESCE(SUM(i.total_amount) FILTER (WHERE i.status = 'PAID'), 0) AS total_collected_mtd,
    COALESCE(SUM(i.balance_due) FILTER (
        WHERE i.status IN ('PENDING', 'PARTIALLY_PAID')
        AND i.due_date < CURRENT_DATE - INTERVAL '30 days'
    ), 0) AS delinquency_30_plus
FROM leases l
JOIN invoices i ON i.lease_id = l.id
WHERE l.status = 'ACTIVE'
  AND i.period_start >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY l.property_id;
```

#### View: `vw_dashboard_maintenance_summary`

```sql
CREATE VIEW vw_dashboard_maintenance_summary AS
SELECT
    t.property_id,
    COUNT(t.id) AS open_tickets,
    COUNT(t.id) FILTER (WHERE t.sla_breached = TRUE AND t.status NOT IN ('RESOLVED', 'CLOSED')) AS breached_sla_tickets,
    COUNT(t.id) FILTER (WHERE t.priority = 'URGENT' AND t.status NOT IN ('RESOLVED', 'CLOSED')) AS urgent_tickets,
    ROUND(
        AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600)
        FILTER (WHERE t.resolved_at IS NOT NULL),
        1
    ) AS avg_resolution_hours
FROM tickets t
WHERE t.deleted_at IS NULL
  AND t.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY t.property_id;
```

---

## 3. MongoDB — Document Schema

### 3.1 Audit Logs Collection

**Collection:** `audit_logs`

```
{
    _id: ObjectId,
    traceId: String,                // UUID correlating the request
    actorId: Long,                  // FK → PostgreSQL users.id
    actorRole: String,              // "ADMIN", "PROPERTY_MANAGER", etc.
    action: String,                 // "CREATE_LEASE", "UPDATE_PROPERTY", etc.
    resourceType: String,           // "LEASE", "PROPERTY", "TENANT", "INVOICE", "TICKET"
    resourceId: String,             // e.g., "lease:12345" (type:pk format)
    oldValue: Object,               // Snapshot before change (NULL for CREATE)
    newValue: Object,               // Snapshot after change (NULL for DELETE)
    ipAddress: String,
    userAgent: String,
    timestamp: Date,                // When the action occurred
    metadata: {                     // Extensible context
        requestPath: String,
        requestMethod: String,
        durationMs: Number
    }
}

Indexes:
  { timestamp: -1 }                          — Default sort, TTL: none (permanent)
  { actorId: 1, timestamp: -1 }              — "What did user X do?"
  { resourceType: 1, resourceId: 1 }         — "What happened to this resource?"
  { action: 1, timestamp: -1 }               — "Show me all lease creations"
  { "metadata.requestPath": 1 }              — "What accessed this endpoint?"

TTL: None (permanent retention — audit data never expires)
Estimated document size: ~1-5 KB
Expected growth: ~10,000 docs/month for a mid-size portfolio
```

### 3.2 Ticket Comments Collection

**Collection:** `ticket_comments`

```
{
    _id: ObjectId,
    ticketId: Long,                 // FK → PostgreSQL tickets.id
    authorId: Long,                 // FK → PostgreSQL users.id
    authorRole: String,             // "TENANT", "PROPERTY_MANAGER", "VENDOR"
    authorName: String,             // Denormalized for display
    body: String,                   // Comment text (max 10,000 chars)
    attachments: [                  // Optional file references
        {
            filename: String,
            filePath: String,
            fileSize: Number,
            contentType: String
        }
    ],
    isInternal: Boolean,            // TRUE = manager/vendor only, FALSE = visible to tenant
    createdAt: Date                 // When comment was posted
}

Indexes:
  { ticketId: 1, createdAt: 1 }             — Get all comments for a ticket, sorted
  { authorId: 1, createdAt: -1 }            — "What comments did this user post?"

TTL: None (kept for ticket lifecycle)
Estimated document size: ~500 bytes - 5 KB (with attachments)
Expected growth: ~5-20 comments per ticket
```

### 3.3 Notification Logs Collection

**Collection:** `notification_logs`

```
{
    _id: ObjectId,
    userId: Long,                   // FK → PostgreSQL users.id (recipient)
    type: String,                   // "PAYMENT_REMINDER", "LEASE_EXPIRY", "TICKET_ASSIGNED", etc.
    channel: String,                // "EMAIL", "SMS", "IN_APP"
    recipient: String,              // Email address or phone number
    subject: String,                // Email subject or SMS preview
    body: String,                   // Full message body
    status: String,                 // "SENT", "DELIVERED", "FAILED", "BOUNCED"
    errorMessage: String,           // If failed
    referenceType: String,          // "INVOICE", "LEASE", "TICKET"
    referenceId: String,            // e.g., "invoice:67890"
    sentAt: Date,
    deliveredAt: Date
}

Indexes:
  { userId: 1, sentAt: -1 }                 — "Show me my recent notifications"
  { status: 1, sentAt: 1 }                  — "Find failed notifications for retry"
  { referenceType: 1, referenceId: 1 }      — "What notifications for this invoice?"

TTL: 90 days (notification logs are operational, not audit)
Estimated document size: ~500 bytes - 2 KB
Expected growth: ~5,000 docs/month
```

### 3.4 Dashboard Snapshots Collection

**Collection:** `dashboard_snapshots`

```
{
    _id: ObjectId,
    propertyId: Long,               // FK → PostgreSQL properties.id (NULL for portfolio-wide)
    type: String,                   // "OCCUPANCY", "FINANCIAL", "MAINTENANCE", "LEASE_EXPIRY"
    period: String,                 // "MTD", "QTD", "YTD", or date range "2026-07"
    data: Object,                   // Computed KPI data (varies by type)
    computedAt: Date,               // When the snapshot was computed
    expiresAt: Date,                // When this snapshot is stale
    createdAt: Date
}

Example data shapes:

// OCCUPANCY snapshot
data: {
    totalUnits: 50,
    availableUnits: 8,
    rentedUnits: 40,
    maintenanceUnits: 2,
    occupancyRate: 80.0,
    trend: "+2.5%"                  // vs previous period
}

// FINANCIAL snapshot
data: {
    totalCollected: 42500.00,
    totalOutstanding: 5000.00,
    collectionRate: 89.5,
    delinquency30Plus: 1500.00,
    delinquency60Plus: 500.00,
    delinquency90Plus: 0.00,
    revenueTrend: [                // last 12 months
        { month: "2025-08", amount: 41000.00 },
        ...
    ]
}

// MAINTENANCE snapshot
data: {
    openTickets: 12,
    avgResolutionHours: 18.5,
    breachesSLAs: 3,
    ticketsByPriority: {
        LOW: 2, MEDIUM: 5, HIGH: 3, URGENT: 2
    }
}

Indexes:
  { propertyId: 1, type: 1, period: 1 }    — Get specific snapshot
  { expiresAt: 1 }                           — Find stale snapshots for refresh
  { computedAt: -1 }                         — Latest snapshots

TTL: 30 days (snapshots are recomputed periodically)
Estimated document size: ~500 bytes - 10 KB
Expected growth: ~1,000 docs/month
```

### 3.5 Session Events Collection

**Collection:** `session_events`

```
{
    _id: ObjectId,
    userId: Long,                   // FK → PostgreSQL users.id
    eventType: String,              // "LOGIN_SUCCESS", "LOGIN_FAILURE", "LOGOUT", "TOKEN_REFRESH"
    ipAddress: String,
    userAgent: String,
    details: Object,                // e.g., { failureReason: "INVALID_PASSWORD", attemptCount: 3 }
    timestamp: Date
}

Indexes:
  { userId: 1, timestamp: -1 }              — Login history for a user
  { eventType: 1, timestamp: -1 }           — Failed login monitoring
  { ipAddress: 1, timestamp: 1 }            — Suspicious activity detection

TTL: 90 days (operational security data)
Estimated document size: ~300 bytes
Expected growth: ~3,000 docs/month per active user
```

---

## 4. Entity-Relationship Diagram

### 4.1 PostgreSQL ERD (Textual)

```
AUTH MODULE:
┌─────────┐     ┌───────────┐     ┌─────────────┐
│  users   │1──N│ user_roles│N──1│    roles     │
└────┬────┘     └───────────┘     └─────────────┘
     │1
     │
     │N
┌────▼────────┐
│ refresh_     │
│  tokens      │
└─────────────┘

┌──────────────┐
│ password_     │
│  history      │
└──────────────┘
  (N per 1 user)

PROPERTY MODULE:
┌────────────┐1──N┌──────────┐1──N┌──────────────────┐
│ properties │────│  units   │────│  tickets          │
└────────────┘    └──────────┘    └──────────────────┘
     │1               │1
     │                │
     │N               │N
┌────▼────────┐  ┌────▼──────────┐
│ property_    │  │  ticket_       │
│  images      │  │  assignments   │
└─────────────┘  └───────────────┘
                  ┌───────────────┐
                  │  ticket_       │
                  │  attachments   │
                  └───────────────┘

TENANT MODULE:
┌─────────┐1──N┌──────────────────┐
│ tenants │────│ tenant_contacts   │
└────┬────┘    └──────────────────┘
     │1
     │
     │N
┌────▼─────────────┐
│ tenant_documents_ │
│  metadata         │
└──────────────────┘
  (files in MongoDB GridFS)

LEASE MODULE:
┌─────────┐1──N┌──────────────┐1──N┌────────────────┐
│ leases  │────│ rent_schedules│────│ security_       │
└────┬────┘    └──────────────┘    │ deposit_ledger  │
     │1                            └────────────────┘
     │
     │N
┌────▼────────┐
│  invoices   │
└────┬───────┘
     │1
     │
     │N
┌────▼────────┐     ┌───────────────┐
│  payments   │1──N┌─│ payment_ledger│
└────┬───────┘    │ └───────────────┘
     │1           │
     │            │
┌────▼────────┐   │
│  receipts   │   │
└─────────────┘   │
                  │
┌──────────────┐  │
│ late_fee_rules│ │
└──────────────┘  │
                  │
MAINTENANCE:      │
┌─────────┐       │
│ vendors │       │
└─────────┘       │
                  │
┌────────────────┐│
│ sla_policies   ││
└────────────────┘┘
```

### 4.2 Key Relationship Notes

```
1. Property → Units:       One-to-many. Property is aggregate root.
2. Unit → Leases:          One-to-many. A unit can have many leases over time,
                           but only ONE ACTIVE lease at any time.
3. Tenant → Leases:        One-to-many. A tenant can have many leases.
                           Business rule: NO two ACTIVE leases same tenant.
4. Lease → Invoices:       One-to-many. Each lease generates monthly invoices.
5. Invoice → Payments:     One-to-many. An invoice can have partial payments
                           (though typically one payment per invoice).
6. Lease → Rent Schedules: One-to-many. Historical rent changes.
7. Unit → Tickets:         One-to-many. Each unit can have many tickets.
8. Users → User_Roles:     One-to-many through join table. Users have N roles
                           (many-to-many).
9. Lease → Property:       Direct FK for query performance (denormalized).
   Lease → Unit:           Direct FK to the specific unit.
   Lease → Tenant:         Direct FK to primary tenant.
   Invoice → Unit:         Denormalized for reporting queries.
   Invoice → Tenant:       Denormalized for reporting queries.
   Ticket → Property:      Denormalized for dashboard queries.
```

---

## 5. Primary Key Strategy

| Table | PK Type | Strategy | Rationale |
|---|---|---|---|
| All PostgreSQL tables | `BIGSERIAL` | Auto-increment integer | Simple, efficient, natural for OLTP. 64-bit ensures no overflow (9.2 quintillion). B-tree indexes on integer PKs are compact and fast. |
| `audit_logs` (MongoDB) | `ObjectId` | Auto-generated | Native MongoDB PK, includes timestamp for implicit sort |
| `ticket_comments` (MongoDB) | `ObjectId` | Auto-generated | Same as above |
| All MongoDB collections | `ObjectId` | Auto-generated | Consistent across all Mongo collections |

**Why not UUID for PostgreSQL PKs?**

| Approach | Verdict | Reason |
|---|---|---|
| UUIDv4 | ❌ Rejected | 16-byte vs 8-byte BIGINT. Random inserts fragment B-tree indexes. Slower joins. |
| UUIDv7 (time-sorted) | ❌ Rejected | Better than v4 but still larger. Ecosystem support is maturing but not standard in Hibernate 6.x. |
| BIGSERIAL (int8) | ✅ **Selected** | 8 bytes, sequential, cache-friendly, fast joins. 64-bit range sufficient for any rental portfolio. |

**Exposed IDs:** The database primary key (`BIGSERIAL id`) is used as the resource identifier in API URLs (`GET /api/v1/properties/42`). This is acceptable for an internal/enterprise tool. If security concerns arise (ID enumeration), apply a secondary UUID (`public_id`) with a unique index for external exposure — **but this is deferred**.

---

## 6. Foreign Key Relationships

### 6.1 Complete FK Reference

| Source Table | FK Column | Target Table | Delete Rule | Update Rule | Justification |
|---|---|---|---|---|---|
| `users` | `deleted_by` | `users` | SET NULL | CASCADE | Self-reference for audit |
| `users` | `created_by` | `users` | SET NULL | CASCADE | Self-reference for audit |
| `users` | `updated_by` | `users` | SET NULL | CASCADE | Self-reference for audit |
| `user_roles` | `user_id` | `users` | CASCADE | CASCADE | Role assignment deleted with user |
| `user_roles` | `role_id` | `roles` | RESTRICT | CASCADE | Cannot delete role that is assigned |
| `user_roles` | `assigned_by` | `users` | SET NULL | CASCADE | Who assigned this role |
| `refresh_tokens` | `user_id` | `users` | CASCADE | CASCADE | Tokens deleted with user |
| `password_history` | `user_id` | `users` | CASCADE | CASCADE | History deleted with user |
| `properties` | `manager_id` | `users` | RESTRICT | CASCADE | Cannot remove manager with active properties |
| `properties` | `deleted_by` | `users` | SET NULL | CASCADE | Audit |
| `properties` | `created_by` | `users` | SET NULL | CASCADE | Audit |
| `properties` | `updated_by` | `users` | SET NULL | CASCADE | Audit |
| `units` | `property_id` | `properties` | RESTRICT | CASCADE | Cannot delete property with units (soft-delete instead) |
| `units` | `deleted_by` | `users` | SET NULL | CASCADE | Audit |
| `units` | `created_by` | `users` | SET NULL | CASCADE | Audit |
| `units` | `updated_by` | `users` | SET NULL | CASCADE | Audit |
| `property_images` | `property_id` | `properties` | CASCADE | CASCADE | Images are part of property |
| `property_images` | `created_by` | `users` | SET NULL | CASCADE | Audit |
| `tenants` | `deleted_by` | `users` | SET NULL | CASCADE | Audit |
| `tenants` | `created_by` | `users` | SET NULL | CASCADE | Audit |
| `tenants` | `updated_by` | `users` | SET NULL | CASCADE | Audit |
| `tenant_contacts` | `tenant_id` | `tenants` | CASCADE | CASCADE | Contacts are part of tenant |
| `tenant_documents_metadata` | `tenant_id` | `tenants` | CASCADE | CASCADE | Documents are part of tenant |
| `tenant_documents_metadata` | `uploaded_by` | `users` | SET NULL | CASCADE | Audit |
| `leases` | `property_id` | `properties` | RESTRICT | CASCADE | Cannot delete property with active leases |
| `leases` | `unit_id` | `units` | RESTRICT | CASCADE | Cannot delete unit with active leases |
| `leases` | `tenant_id` | `tenants` | RESTRICT | CASCADE | Cannot delete tenant with active leases |
| `leases` | `deleted_by` | `users` | SET NULL | CASCADE | Audit |
| `leases` | `created_by` | `users` | SET NULL | CASCADE | Audit |
| `leases` | `updated_by` | `users` | SET NULL | CASCADE | Audit |
| `rent_schedules` | `lease_id` | `leases` | CASCADE | CASCADE | Schedules are part of lease |
| `rent_schedules` | `created_by` | `users` | SET NULL | CASCADE | Audit |
| `security_deposit_ledger` | `lease_id` | `leases` | CASCADE | CASCADE | Ledger entries are part of lease |
| `security_deposit_ledger` | `reference_invoice_id` | `invoices` | SET NULL | CASCADE | Optional reference |
| `security_deposit_ledger` | `created_by` | `users` | SET NULL | CASCADE | Audit |
| `invoices` | `lease_id` | `leases` | RESTRICT | CASCADE | Cannot delete lease with invoices |
| `invoices` | `unit_id` | `units` | RESTRICT | CASCADE | Denormalized ref |
| `invoices` | `tenant_id` | `tenants` | RESTRICT | CASCADE | Denormalized ref |
| `invoices` | `created_by` | `users` | SET NULL | CASCADE | Audit |
| `invoices` | `updated_by` | `users` | SET NULL | CASCADE | Audit |
| `payments` | `invoice_id` | `invoices` | RESTRICT | CASCADE | Cannot delete invoice with payments |
| `payments` | `tenant_id` | `tenants` | RESTRICT | CASCADE | Denormalized ref |
| `payments` | `created_by` | `users` | SET NULL | CASCADE | Audit |
| `payments` | `reconciled_by` | `users` | SET NULL | CASCADE | Audit |
| `payment_ledger` | `payment_id` | `payments` | CASCADE | CASCADE | Ledger entries part of payment |
| `payment_ledger` | `invoice_id` | `invoices` | RESTRICT | CASCADE | Cannot delete invoice with ledger entries |
| `payment_ledger` | `created_by` | `users` | SET NULL | CASCADE | Audit |
| `receipts` | `payment_id` | `payments` | CASCADE | CASCADE | Receipt tied to payment |
| `receipts` | `invoice_id` | `invoices` | RESTRICT | CASCADE | Cannot delete invoiced receipt |
| `receipts` | `tenant_id` | `tenants` | RESTRICT | CASCADE | Denormalized ref |
| `receipts` | `generated_by` | `users` | SET NULL | CASCADE | Audit |
| `tickets` | `unit_id` | `units` | RESTRICT | CASCADE | Cannot delete unit with open tickets |
| `tickets` | `property_id` | `properties` | RESTRICT | CASCADE | Denormalized ref |
| `tickets` | `reporter_id` | `users` | RESTRICT | CASCADE | Cannot delete reporter with open tickets |
| `tickets` | `assignee_id` | `users` | SET NULL | CASCADE | Assignee may be removed |
| `tickets` | `vendor_id` | `vendors` | SET NULL | CASCADE | Vendor may be removed |
| `tickets` | `deleted_by` | `users` | SET NULL | CASCADE | Audit |
| `tickets` | `created_by` | `users` | SET NULL | CASCADE | Audit |
| `tickets` | `updated_by` | `users` | SET NULL | CASCADE | Audit |
| `ticket_assignments` | `ticket_id` | `tickets` | CASCADE | CASCADE | Assignment part of ticket |
| `ticket_assignments` | `assigned_to` | `users` | RESTRICT | CASCADE | Cannot delete assigned user reference |
| `ticket_assignments` | `assigned_by` | `users` | SET NULL | CASCADE | Audit |
| `ticket_attachments` | `ticket_id` | `tickets` | CASCADE | CASCADE | Attachment part of ticket |
| `ticket_attachments` | `uploaded_by` | `users` | SET NULL | CASCADE | Audit |
| `vendors` | `deleted_by` | `users` | SET NULL | CASCADE | Audit |
| `vendors` | `created_by` | `users` | SET NULL | CASCADE | Audit |
| `vendors` | `updated_by` | `users` | SET NULL | CASCADE | Audit |

### 6.2 Delete Rule Legend

| Rule | Meaning | Used When |
|---|---|---|
| `CASCADE` | Delete parent → delete children | Children have no independent existence |
| `RESTRICT` | Prevent delete if children exist | Parent is referenced by critical data |
| `SET NULL` | Set FK to NULL on parent delete | Optional reference, non-critical |

---

## 7. Index Strategy

### 7.1 Index Design Principles

```
1. Every FK column gets an index (unless covered by another index)
2. Every query pattern gets at most one optimal index
3. Composite indexes ordered by: EQUALITY → RANGE → SORT columns
4. Avoid over-indexing: each index slows writes by ~10-20%
5. Use GIN indexes for JSONB columns
6. Use partial indexes for soft-delete filtering (WHERE deleted_at IS NULL)
7. Monitor pg_stat_user_indexes for unused indexes post-launch
```

### 7.2 PostgreSQL Index Definitions

#### Auth Module Indexes

```sql
-- users
CREATE UNIQUE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_locked ON users (locked_until) WHERE locked_until IS NOT NULL;

-- refresh_tokens
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id, revoked);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens (expires_at) WHERE revoked = FALSE;

-- password_history
CREATE INDEX idx_password_history_user ON password_history (user_id, created_at DESC);

-- user_roles
CREATE UNIQUE INDEX idx_user_roles_unique ON user_roles (user_id, role_id);
CREATE INDEX idx_user_roles_role ON user_roles (role_id);
```

#### Property Module Indexes

```sql
-- properties
CREATE INDEX idx_properties_manager ON properties (manager_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_status ON properties (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_city ON properties (city);
CREATE INDEX idx_properties_attributes ON properties USING GIN (attributes jsonb_path_ops);

-- units
CREATE UNIQUE INDEX idx_units_property_unit ON units (property_id, unit_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_units_status ON units (property_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_units_rent_range ON units (monthly_rent) WHERE status = 'AVAILABLE' AND deleted_at IS NULL;

-- property_images
CREATE INDEX idx_property_images_property ON property_images (property_id, sort_order);
```

#### Tenant Module Indexes

```sql
-- tenants
CREATE INDEX idx_tenants_email ON tenants (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_name ON tenants (last_name, first_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_status ON tenants (status) WHERE deleted_at IS NULL;

-- tenant_contacts
CREATE INDEX idx_tenant_contacts_tenant ON tenant_contacts (tenant_id, contact_type);

-- tenant_documents_metadata
CREATE INDEX idx_tenant_docs_tenant ON tenant_documents_metadata (tenant_id, document_type);
```

#### Lease Module Indexes

```sql
-- leases
CREATE INDEX idx_leases_unit_active ON leases (unit_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leases_tenant_active ON leases (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leases_expiry ON leases (end_date) WHERE status = 'ACTIVE' AND deleted_at IS NULL;
CREATE INDEX idx_leases_property ON leases (property_id, status) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_leases_number ON leases (lease_number);

-- rent_schedules
CREATE UNIQUE INDEX idx_rent_schedules_lease_period ON rent_schedules (lease_id, effective_from);
CREATE INDEX idx_rent_schedules_active ON rent_schedules (lease_id) WHERE is_active = TRUE;

-- security_deposit_ledger
CREATE INDEX idx_deposit_ledger_lease ON security_deposit_ledger (lease_id, created_at);
```

#### Rent Module Indexes

```sql
-- invoices
CREATE UNIQUE INDEX idx_invoices_number ON invoices (invoice_number);
CREATE INDEX idx_invoices_lease_period ON invoices (lease_id, period_start);
CREATE INDEX idx_invoices_tenant_status ON invoices (tenant_id, status);
CREATE INDEX idx_invoices_unit_status ON invoices (unit_id, status);
CREATE INDEX idx_invoices_aging ON invoices (due_date, status)
    WHERE status IN ('PENDING', 'PARTIALLY_PAID');
CREATE INDEX idx_invoices_due_date ON invoices (due_date);  -- critical for delinquency

-- payments
CREATE UNIQUE INDEX idx_payments_number ON payments (payment_number);
CREATE INDEX idx_payments_invoice ON payments (invoice_id);
CREATE INDEX idx_payments_tenant_date ON payments (tenant_id, payment_date DESC);
CREATE INDEX idx_payments_method ON payments (payment_method);
CREATE INDEX idx_payments_status ON payments (status);

-- payment_ledger
CREATE INDEX idx_payment_ledger_invoice ON payment_ledger (invoice_id, created_at);
CREATE INDEX idx_payment_ledger_payment ON payment_ledger (payment_id);

-- receipts
CREATE UNIQUE INDEX idx_receipts_number ON receipts (receipt_number);
CREATE INDEX idx_receipts_payment ON receipts (payment_id);
CREATE INDEX idx_receipts_tenant ON receipts (tenant_id, generated_at DESC);
```

#### Maintenance Module Indexes

```sql
-- tickets
CREATE UNIQUE INDEX idx_tickets_number ON tickets (ticket_number);
CREATE INDEX idx_tickets_unit_status ON tickets (unit_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_property_status ON tickets (property_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_assignee ON tickets (assignee_id, status) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_tickets_priority ON tickets (priority, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_sla ON tickets (status, sla_breached)
    WHERE status NOT IN ('RESOLVED', 'CLOSED') AND deleted_at IS NULL;
CREATE INDEX idx_tickets_created ON tickets (created_at DESC);

-- ticket_assignments
CREATE INDEX idx_ticket_assignments_ticket ON ticket_assignments (ticket_id, assigned_at DESC);

-- ticket_attachments
CREATE INDEX idx_ticket_attachments_ticket ON ticket_attachments (ticket_id);

-- vendors
CREATE INDEX idx_vendors_trade ON vendors (trade_specialty, status) WHERE deleted_at IS NULL;
```

### 7.3 Composite Index Strategy — Query Patterns

```
Query Pattern                                    Optimal Index
──────────────────────────────────────────────────────────────────────
"Active leases for a unit"                       idx_leases_unit_active
"Active leases for a tenant"                     idx_leases_tenant_active
"Leases expiring in 30 days"                     idx_leases_expiry
"Invoices pending for a tenant"                  idx_invoices_tenant_status
"Overdue invoices (aging report)"                idx_invoices_aging
"Payments for an invoice"                        idx_payments_invoice
"Open tickets for a property"                    idx_tickets_property_status
"Tickets assigned to a vendor"                   idx_tickets_assignee
"Breached SLA tickets"                           idx_tickets_sla
"Units available in a property"                  idx_units_status
"Properties managed by a user"                   idx_properties_manager
"Audit logs for a resource"                      (MongoDB compound index)
"Comments for a ticket"                          (MongoDB compound index)
```

---

## 8. Normalization Analysis

### 8.1 Normal Form Compliance

| Table | 1NF | 2NF | 3NF | BCNF | Notes |
|---|---|---|---|---|---|
| `users` | ✅ | ✅ | ✅ | ✅ | Atomic columns, no partial dependencies, no transitive dependencies |
| `roles` | ✅ | ✅ | ✅ | ✅ | Simple lookup table |
| `user_roles` | ✅ | ✅ | ✅ | ✅ | Junction table, no anomalies |
| `refresh_tokens` | ✅ | ✅ | ✅ | ✅ | Dependent on user only |
| `password_history` | ✅ | ✅ | ✅ | ✅ | Dependent on user only |
| `properties` | ✅ | ✅ | ✅ | ✅ | Address is atomic (split into components) |
| `units` | ✅ | ✅ | ✅ | ✅ | FK to properties only; no transitive deps |
| `property_images` | ✅ | ✅ | ✅ | ✅ | Dependent on property |
| `tenants` | ✅ | ✅ | ✅ | ✅ | Contact info atomic |
| `tenant_contacts` | ✅ | ✅ | ✅ | ✅ | Separate table for multi-value contact types |
| `tenant_documents_metadata` | ✅ | ✅ | ✅ | ✅ | Metadata only; files in GridFS |
| `leases` | ✅ | ✅ | ✅ | ✅ | FK to unit, tenant, property; no transitive deps |
| `rent_schedules` | ✅ | ✅ | ✅ | ✅ | Full functional dependency on lease_id + effective_from |
| `security_deposit_ledger` | ✅ | ✅ | ✅ | ✅ | Audit trail, no anomalies |
| `invoices` | ✅ | ✅ | ✅ | ✅ | Computed columns (total, balance) at app level |
| `payments` | ✅ | ✅ | ✅ | ✅ | FK to invoice; no transitive deps |
| `payment_ledger` | ✅ | ✅ | ✅ | ✅ | Immutable audit trail |
| `receipts` | ✅ | ✅ | ✅ | ✅ | FK to payment; JSONB for flexible receipt data |
| `late_fee_rules` | ✅ | ✅ | ✅ | ✅ | Independent lookup |
| `vendors` | ✅ | ✅ | ✅ | ✅ | Atomic columns |
| `tickets` | ✅ | ✅ | ✅ | ✅ | FK to unit, property, reporter; denormalized for perf |
| `ticket_assignments` | ✅ | ✅ | ✅ | ✅ | Audit trail |
| `ticket_attachments` | ✅ | ✅ | ✅ | ✅ | Dependent on ticket |
| `sla_policies` | ✅ | ✅ | ✅ | ✅ | Independent lookup |

### 8.2 Deliberate Denormalization

The following columns are **denormalized** for performance, with documented justification:

| Table | Denormalized Column | Source | Rationale |
|---|---|---|---|
| `leases` | `property_id` | Derived from `unit_id → property_id` | Avoids join for dashboard queries. 99% of lease queries need property context. |
| `invoices` | `unit_id` | Derived from `lease_id → unit_id` | Avoids 2 joins in aging/delinquency reports. |
| `invoices` | `tenant_id` | Derived from `lease_id → tenant_id` | Avoids join in tenant invoice queries. |
| `payments` | `tenant_id` | Derived from `invoice_id → lease_id → tenant_id` | Avoids 2 joins in tenant payment history. |
| `receipts` | `tenant_id` | Derived from `payment_id → invoice_id → lease_id → tenant_id` | Avoids 3 joins in receipt lookup. |
| `tickets` | `property_id` | Derived from `unit_id → property_id` | Avoids join in property dashboard queries. |
| `lease_number` | Full string | Manual generation | Human-readable reference (e.g., "LS-2026-00042") not derivable. |

**Consistency guarantee:** Application layer ensures denormalized columns are always written together with the source data (within the same transaction).

### 8.3 JSONB Usage (Controlled Denormalization)

| Table | JSONB Column | Purpose | Search Required? |
|---|---|---|---|
| `properties` | `attributes` | Market-specific fields (pool, gym, pet policy, etc.) | Yes (GIN index) |
| `units` | `attributes` | Unit-specific features (furnished, balcony, parking, etc.) | Yes (GIN index) |
| `leases` | `co_tenants` | Array of co-tenant user IDs | No (app-level filtering) |
| `receipts` | `receipt_data` | Full receipt breakdown | No (display only) |

**Why JSONB instead of separate tables for attributes?**
- Property/unit attributes vary widely by market and property type
- Adding columns for every possible feature leads to dozens of NULL columns
- No cross-cutting queries on individual attributes
- GIN indexes support efficient JSONB searches

---

## 9. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| **Database name** | lowercase, alphanumeric | `smartlease` |
| **Schema name** | lowercase | `public` (default) |
| **Table name** | lowercase, snake_case, plural | `users`, `refresh_tokens`, `tenant_documents_metadata` |
| **Column name** | lowercase, snake_case | `first_name`, `created_at`, `security_deposit` |
| **Primary key** | `id` (BIGSERIAL) | `id` on every table |
| **Foreign key** | `{referenced_table}_id` | `user_id`, `property_id`, `lease_id` |
| **Unique constraint** | `idx_{table}_{columns}` | `idx_leases_unit_active` |
| **Index** | `idx_{table}_{columns}` | `idx_invoices_tenant_status` |
| **Unique index** | `idx_{table}_{columns}` (add UNIQUE) | `idx_users_email` (UNIQUE) |
| **View** | `vw_{description}` | `vw_dashboard_occupancy` |
| **Domain (enum)** | lowercase, snake_case | `user_status`, `invoice_status` |
| **Sequence** | `{table}_id_seq` (default) | `leases_id_seq` |
| **MongoDB collection** | lowercase, snake_case, plural | `audit_logs`, `ticket_comments` |
| **MongoDB field** | camelCase | `traceId`, `resourceType`, `createdAt` |

### MongoDB ↔ PostgreSQL Field Style

```
PostgreSQL:     created_at     updated_at    user_id     deleted_at
MongoDB:        createdAt      updatedAt     userId      (N/A — soft-delete not used in Mongo)
```

This difference is intentional:
- PostgreSQL follows SQL convention (snake_case, set via `@Column(name = "created_at")`)
- MongoDB follows JavaScript convention (camelCase, default in Spring Data MongoDB)

---

## 10. Migration Strategy

### 10.1 Flyway Migration Files

```
db/postgres/migrations/
│
├── V1__init_schema.sql
│   • All CREATE TABLE statements
│   • All domain (enum) definitions
│   • All index creation
│   • All FK constraints
│
├── V2__seed_roles.sql
│   • INSERT INTO roles (ADMIN, PROPERTY_MANAGER, TENANT, VENDOR, VIEWER)
│   • INSERT INTO late_fee_rules (default rule)
│   • INSERT INTO sla_policies (LOW, MEDIUM, HIGH, URGENT)
│
├── V3__create_views.sql
│   • vw_dashboard_occupancy
│   • vw_dashboard_financial_summary
│   • vw_dashboard_maintenance_summary
│
└── V4__seed_demo_data.sql (optional)
    • Demo property, units, manager, tenant accounts for development
```

### 10.2 Migration Rules

| Rule | Description |
|---|---|
| **Immutability** | Once applied, a migration is NEVER modified |
| **Additive only** | New changes are always new V`N` files |
| **Backward compatible** | V`N`+1 must not break V`N` data |
| **Rollback scripts** | V`N`__undo.sql exists for emergency rollbacks (not Flyway-managed) |
| **Review required** | Every migration must be reviewed by 2 developers |
| **Tested locally** | Migrations must work on a clean database with fresh test data |
| **No application DDL** | No `CREATE TABLE` or `ALTER TABLE` in application code |
| **Consistent naming** | `V{major}__{description}.sql` e.g., `V5__add_invoice_notes_column.sql` |

### 10.3 Safe Migration Patterns

```sql
-- SAFE: Adding a nullable column (backward compatible)
ALTER TABLE invoices ADD COLUMN notes TEXT;

-- SAFE: Adding a column with default (backward compatible)
ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) NOT NULL DEFAULT 'en';

-- SAFE: Creating a new table
CREATE TABLE late_fee_rules ( ... );

-- UNSAFE: Renaming a column (breaks existing queries)
-- SOLUTION: Add new column, migrate data, drop old column in separate version
ALTER TABLE users RENAME COLUMN phone TO contact_phone;  -- DON'T

-- UNSAFE: Changing column type (may break existing data)
-- SOLUTION: Add new column with new type, migrate data, drop old column
ALTER TABLE leases ALTER COLUMN rent_amount TYPE NUMERIC(12,2);  -- CHECK FIRST

-- UNSAFE: Dropping a column (breaks existing queries)
-- SOLUTION: Mark as deprecated, remove from code, drop in next release
ALTER TABLE tenants DROP COLUMN old_field;  -- DON'T blindly
```

---

> *This database design document is the authoritative reference for all SmartLease data storage.*  
> *For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).*  
> *For business requirements, see [REQUIREMENTS.md](./REQUIREMENTS.md).*  
> *For project context, see [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).*
