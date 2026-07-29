# SmartLease — API Contract

> **REST API Specification** — Request/Response Contracts, Validation & Status Codes  
> *Version 1.0* | *Base URL: `/api/v1`* | *Content-Type: `application/json`*

---

## Table of Contents

1. [API Standards](#1-api-standards)
   - 1.1. Response Envelope
   - 1.2. Pagination
   - 1.3. Error Response
   - 1.4. Validation Errors
   - 1.5. Common Headers
   - 1.6. HTTP Status Codes
2. [Authentication APIs](#2-authentication-apis)
3. [Property Management APIs](#3-property-management-apis)
4. [Tenant Management APIs](#4-tenant-management-apis)
5. [Lease Management APIs](#5-lease-management-apis)
6. [Rent Collection APIs](#6-rent-collection-apis)
7. [Maintenance Tickets APIs](#7-maintenance-tickets-apis)
8. [Dashboard APIs](#8-dashboard-apis)

---

## 1. API Standards

### 1.1 Standard Response Envelope

Every API response follows this structure:

```
HTTP/1.1 {statusCode} {reason}
Content-Type: application/json

{
    "status": "SUCCESS" | "ERROR",
    "code": {httpStatusCode},
    "message": "{human-readable message}",
    "data": { ... } | null,
    "errors": [ ... ] | null,
    "timestamp": "{ISO-8601 UTC}",
    "path": "{request path}"
}
```

#### Success Response

```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Property retrieved successfully",
    "data": {
        "id": 1,
        "name": "Oakwood Apartments",
        "type": "RESIDENTIAL",
        "city": "Austin",
        "state": "TX",
        "totalUnits": 20,
        "status": "ACTIVE"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/properties/1"
}
```

### 1.2 Paginated Response

```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Properties retrieved successfully",
    "data": {
        "content": [
            { "id": 1, "name": "Oakwood Apartments", ... },
            { "id": 2, "name": "Maple Gardens", ... }
        ],
        "page": 0,
        "size": 20,
        "totalElements": 150,
        "totalPages": 8,
        "last": false,
        "first": true,
        "sort": {
            "sorted": true,
            "unsorted": false,
            "empty": false
        }
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/properties?page=0&size=20"
}
```

**Query Parameters for Paginated Endpoints:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `int` | `0` | Zero-based page number |
| `size` | `int` | `20` | Page size (max 100) |
| `sort` | `string` | `createdAt,desc` | Sort field and direction |

### 1.3 Error Response

```json
{
    "status": "ERROR",
    "code": 404,
    "message": "Property not found with id: 999",
    "data": null,
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/properties/999"
}
```

### 1.4 Validation Error Response

```json
{
    "status": "ERROR",
    "code": 400,
    "message": "Validation failed",
    "data": null,
    "errors": [
        {
            "field": "name",
            "rejectedValue": "",
            "message": "Property name is required"
        },
        {
            "field": "monthlyRent",
            "rejectedValue": -100,
            "message": "Monthly rent must be positive"
        },
        {
            "field": "startDate",
            "rejectedValue": "2026-12-31",
            "message": "Start date must be before end date"
        }
    ],
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/properties"
}
```

### 1.5 Common Headers

| Header | When | Description |
|---|---|---|
| `Authorization: Bearer {token}` | All authenticated requests | JWT access token |
| `X-Refresh-Token: {token}` | Token refresh | JWT refresh token |
| `X-Trace-Id: {uuid}` | All requests | Request tracing (optional, generated if absent) |
| `Accept-Language: en` | All requests | i18n language preference |
| `Content-Type: application/json` | POST/PUT/PATCH | Request body format |
| `If-Match: "{version}"` | Conditional updates | ETag for optimistic locking |

### 1.6 HTTP Status Codes

| Code | Usage |
|---|---|
| `200 OK` | Successful GET, PUT, PATCH |
| `201 Created` | Successful POST (resource created) |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Validation failure, malformed request body |
| `401 Unauthorized` | Missing JWT, expired token, invalid signature |
| `403 Forbidden` | Authenticated but insufficient permissions |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Version mismatch (optimistic locking), duplicate resource |
| `422 Unprocessable Entity` | Business rule violation (e.g., lease dates overlap) |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unhandled server error |

---

## 2. Authentication APIs

### 2.1 Register User

Creates a new user account with role assignment.

```
POST /api/v1/auth/register
```

**Request Body:**
```json
{
    "email": "john.doe@example.com",
    "password": "Secure@Pass123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1-512-555-0100",
    "role": "PROPERTY_MANAGER"
}
```

**Field Validation:**

| Field | Rules |
|---|---|
| `email` | Required, valid email format, max 255 chars, unique (case-insensitive) |
| `password` | Required, min 12 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char |
| `firstName` | Required, min 1 char, max 100 chars |
| `lastName` | Required, min 1 char, max 100 chars |
| `phone` | Optional, valid phone format if provided |
| `role` | Optional, defaults to `TENANT`. One of: `ADMIN`, `PROPERTY_MANAGER`, `TENANT`, `VENDOR`, `VIEWER` |

**Success Response (201):**
```json
{
    "status": "SUCCESS",
    "code": 201,
    "message": "User registered successfully",
    "data": {
        "id": 42,
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "PROPERTY_MANAGER",
        "status": "ACTIVE",
        "createdAt": "2026-07-28T10:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/auth/register"
}
```

**Error Codes:** `400` (validation), `409` (duplicate email)

---

### 2.2 Login

Authenticates user credentials and returns JWT tokens.

```
POST /api/v1/auth/login
```

**Rate Limit:** 10 requests per minute per IP

**Request Body:**
```json
{
    "email": "john.doe@example.com",
    "password": "Secure@Pass123"
}
```

**Field Validation:**

| Field | Rules |
|---|---|
| `email` | Required, valid email format |
| `password` | Required |

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Login successful",
    "data": {
        "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "tokenType": "Bearer",
        "expiresIn": 900,
        "user": {
            "id": 42,
            "email": "john.doe@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "role": "PROPERTY_MANAGER"
        }
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/auth/login"
}
```

**Error Codes:** `400` (validation), `401` (invalid credentials), `423` (account locked)

**Account Locked Response (423):**
```json
{
    "status": "ERROR",
    "code": 423,
    "message": "Account is locked due to 5 failed login attempts. Try again after 15 minutes.",
    "data": {
        "lockedUntil": "2026-07-28T10:45:00Z",
        "remainingMinutes": 15
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/auth/login"
}
```

---

### 2.3 Refresh Token

Exchanges a valid refresh token for a new access token and a new refresh token.

```
POST /api/v1/auth/refresh
```

**Request Body:**
```json
{
    "refreshToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Token refreshed successfully",
    "data": {
        "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "f6e5d4c3-b2a1-0987-fedc-ba0987654321",
        "tokenType": "Bearer",
        "expiresIn": 900
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/auth/refresh"
}
```

**Error Codes:** `400` (validation), `401` (expired/revoked/invalid refresh token)

---

### 2.4 Logout

Revokes the refresh token and blacklists the access token.

```
POST /api/v1/auth/logout
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "refreshToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Logged out successfully",
    "data": null,
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/auth/logout"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized)

---

### 2.5 Forgot Password

Sends a password reset link to the user's email.

```
POST /api/v1/auth/forgot-password
```

**Rate Limit:** 3 requests per hour per email

**Request Body:**
```json
{
    "email": "john.doe@example.com"
}
```

**Success Response (200):**
> Note: Always returns 200 even if email doesn't exist (prevents email enumeration).

```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "If the email exists, a password reset link has been sent.",
    "data": null,
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/auth/forgot-password"
}
```

**Error Codes:** `400` (validation), `429` (rate limit)

---

### 2.6 Reset Password

Resets the password using a valid reset token.

```
POST /api/v1/auth/reset-password
```

**Request Body:**
```json
{
    "token": "reset-token-uuid-from-email",
    "newPassword": "NewSecure@Pass456"
}
```

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Password reset successfully",
    "data": null,
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/auth/reset-password"
}
```

**Error Codes:** `400` (validation, expired/invalid token), `422` (password in history)

---

### 2.7 Get Current User Profile

```
GET /api/v1/auth/me
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "User profile retrieved",
    "data": {
        "id": 42,
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+1-512-555-0100",
        "role": "PROPERTY_MANAGER",
        "status": "ACTIVE",
        "lastLoginAt": "2026-07-28T10:30:00Z",
        "passwordChangedAt": "2026-06-01T08:00:00Z",
        "createdAt": "2026-01-15T09:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/auth/me"
}
```

**Error Codes:** `401` (unauthorized)

---

### 2.8 Update Current User Profile

```
PUT /api/v1/auth/me
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "firstName": "Jonathan",
    "lastName": "Doe",
    "phone": "+1-512-555-0200"
}
```

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Profile updated successfully",
    "data": {
        "id": 42,
        "email": "john.doe@example.com",
        "firstName": "Jonathan",
        "lastName": "Doe",
        "phone": "+1-512-555-0200",
        "role": "PROPERTY_MANAGER",
        "status": "ACTIVE"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/auth/me"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized)

---

### 2.9 Change Password

```
PUT /api/v1/auth/me/password
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "currentPassword": "Secure@Pass123",
    "newPassword": "NewSecure@Pass456"
}
```

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Password changed successfully",
    "data": null,
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/auth/me/password"
}
```

**Error Codes:** `400` (validation), `401` (incorrect current password), `422` (password in last 5 history)

---

## 3. Property Management APIs

### 3.1 List Properties

```
GET /api/v1/properties?page=0&size=20&sort=createdAt,desc
```

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `search` | `string` | Search by name or city (partial match) |
| `type` | `string` | Filter by type: `RESIDENTIAL`, `COMMERCIAL`, `MIXED_USE` |
| `status` | `string` | Filter by status: `ACTIVE`, `INACTIVE`, `UNDER_RENOVATION` |
| `managerId` | `long` | Filter by assigned manager |
| `city` | `string` | Filter by city |
| `state` | `string` | Filter by state code |

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Properties retrieved successfully",
    "data": {
        "content": [
            {
                "id": 1,
                "name": "Oakwood Apartments",
                "type": "RESIDENTIAL",
                "addressLine1": "123 Main St",
                "city": "Austin",
                "state": "TX",
                "postalCode": "78701",
                "status": "ACTIVE",
                "totalUnits": 20,
                "availableUnits": 3,
                "managerName": "John Doe",
                "createdAt": "2026-01-15T09:00:00Z"
            }
        ],
        "page": 0,
        "size": 20,
        "totalElements": 15,
        "totalPages": 1,
        "last": true,
        "first": true
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/properties"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden)

---

### 3.2 Get Property by ID

```
GET /api/v1/properties/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Property retrieved successfully",
    "data": {
        "id": 1,
        "name": "Oakwood Apartments",
        "type": "RESIDENTIAL",
        "description": "Luxury apartment complex in downtown Austin",
        "addressLine1": "123 Main St",
        "addressLine2": null,
        "city": "Austin",
        "state": "TX",
        "postalCode": "78701",
        "country": "US",
        "latitude": 30.2672,
        "longitude": -97.7431,
        "managerId": 42,
        "managerName": "John Doe",
        "attributes": {
            "hasPool": true,
            "hasGym": true,
            "petPolicy": "Cats and small dogs allowed",
            "parkingType": "GARAGE",
            "yearBuilt": 2020
        },
        "status": "ACTIVE",
        "totalUnits": 20,
        "availableUnits": 3,
        "unitsSummary": {
            "available": 3,
            "rented": 15,
            "maintenance": 2,
            "reserved": 0,
            "unavailable": 0
        },
        "images": [
            {
                "id": 1,
                "filename": "oakwood-exterior.jpg",
                "isPrimary": true,
                "sortOrder": 0
            }
        ],
        "createdAt": "2026-01-15T09:00:00Z",
        "updatedAt": "2026-07-20T14:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/properties/1"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (not found)

---

### 3.3 Create Property

```
POST /api/v1/properties
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "name": "Oakwood Apartments",
    "type": "RESIDENTIAL",
    "description": "Luxury apartment complex in downtown Austin",
    "addressLine1": "123 Main St",
    "addressLine2": null,
    "city": "Austin",
    "state": "TX",
    "postalCode": "78701",
    "country": "US",
    "latitude": 30.2672,
    "longitude": -97.7431,
    "managerId": 42,
    "attributes": {
        "hasPool": true,
        "hasGym": true,
        "petPolicy": "Cats and small dogs allowed"
    }
}
```

**Field Validation:**

| Field | Rules |
|---|---|
| `name` | Required, max 200 chars |
| `type` | Required, one of: `RESIDENTIAL`, `COMMERCIAL`, `MIXED_USE` |
| `addressLine1` | Required, max 255 chars |
| `city` | Required, max 100 chars |
| `state` | Required, max 50 chars |
| `postalCode` | Required, max 20 chars |
| `country` | Optional, default `US`, max 50 chars |
| `managerId` | Required, must reference an existing user with manager role |
| `attributes` | Optional JSONB object |

**Success Response (201):**
```json
{
    "status": "SUCCESS",
    "code": 201,
    "message": "Property created successfully",
    "data": {
        "id": 1,
        "name": "Oakwood Apartments",
        "type": "RESIDENTIAL",
        "city": "Austin",
        "state": "TX",
        "status": "ACTIVE",
        "createdAt": "2026-07-28T10:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/properties"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `409` (duplicate)

---

### 3.4 Update Property

```
PUT /api/v1/properties/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "name": "Oakwood Luxury Apartments",
    "type": "RESIDENTIAL",
    "description": "Updated description",
    "addressLine1": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "postalCode": "78702",
    "managerId": 42,
    "attributes": {
        "hasPool": true,
        "hasGym": false,
        "petPolicy": "No pets allowed"
    },
    "version": 3
}
```

**Field Validation:** Same as Create. The `version` field is required for optimistic locking.

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Property updated successfully",
    "data": {
        "id": 1,
        "name": "Oakwood Luxury Apartments",
        "version": 4,
        "updatedAt": "2026-07-28T11:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T11:00:00Z",
    "path": "/api/v1/properties/1"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (not found), `409` (version conflict)

---

### 3.5 Delete Property (Soft Delete)

```
DELETE /api/v1/properties/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (204):**
> No content body.

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (not found)

---

### 3.6 List Units for a Property

```
GET /api/v1/properties/{propertyId}/units?page=0&size=50&sort=unitNumber,asc
```

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `status` | `string` | Filter by: `AVAILABLE`, `RENTED`, `MAINTENANCE`, `RESERVED`, `UNAVAILABLE` |
| `minRent` | `decimal` | Minimum monthly rent |
| `maxRent` | `decimal` | Maximum monthly rent |
| `bedrooms` | `int` | Filter by number of bedrooms |

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Units retrieved successfully",
    "data": {
        "content": [
            {
                "id": 101,
                "unitNumber": "101",
                "floor": 1,
                "bedrooms": 2,
                "bathrooms": 1.0,
                "squareFeet": 850,
                "monthlyRent": 1500.00,
                "securityDeposit": 1500.00,
                "status": "AVAILABLE",
                "currentLeaseId": null,
                "currentTenantName": null,
                "attributes": {
                    "hasDishwasher": true,
                    "hasBalcony": false
                }
            },
            {
                "id": 102,
                "unitNumber": "102",
                "floor": 1,
                "bedrooms": 3,
                "bathrooms": 2.0,
                "squareFeet": 1200,
                "monthlyRent": 2200.00,
                "securityDeposit": 2200.00,
                "status": "RENTED",
                "currentLeaseId": 55,
                "currentTenantName": "Jane Smith",
                "attributes": {
                    "hasDishwasher": true,
                    "hasBalcony": true
                }
            }
        ],
        "page": 0,
        "size": 50,
        "totalElements": 20,
        "totalPages": 1,
        "last": true,
        "first": true
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/properties/1/units"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (property not found)

---

### 3.7 Get Unit by ID

```
GET /api/v1/units/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Unit retrieved successfully",
    "data": {
        "id": 101,
        "propertyId": 1,
        "propertyName": "Oakwood Apartments",
        "unitNumber": "101",
        "floor": 1,
        "bedrooms": 2,
        "bathrooms": 1.0,
        "squareFeet": 850,
        "monthlyRent": 1500.00,
        "securityDeposit": 1500.00,
        "status": "AVAILABLE",
        "leaseHistory": [
            {
                "leaseId": 42,
                "tenantName": "Jane Smith",
                "startDate": "2025-01-01",
                "endDate": "2025-12-31",
                "status": "EXPIRED"
            }
        ],
        "attributes": {
            "hasDishwasher": true,
            "hasBalcony": false
        },
        "createdAt": "2026-01-15T09:00:00Z",
        "updatedAt": "2026-07-20T14:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/units/101"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (not found)

---

### 3.8 Add Unit to Property

```
POST /api/v1/properties/{propertyId}/units
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "unitNumber": "103",
    "floor": 1,
    "bedrooms": 1,
    "bathrooms": 1.0,
    "squareFeet": 650,
    "monthlyRent": 1200.00,
    "securityDeposit": 1200.00,
    "attributes": {
        "hasDishwasher": false,
        "hasBalcony": false
    }
}
```

**Field Validation:**

| Field | Rules |
|---|---|
| `unitNumber` | Required, max 50 chars, unique within property |
| `bedrooms` | Required, min 0 |
| `bathrooms` | Required, min 0, step 0.5 |
| `monthlyRent` | Required, min 0.01 |
| `status` | Optional, defaults to `AVAILABLE` |

**Success Response (201):**
```json
{
    "status": "SUCCESS",
    "code": 201,
    "message": "Unit added successfully",
    "data": {
        "id": 103,
        "unitNumber": "103",
        "status": "AVAILABLE",
        "monthlyRent": 1200.00,
        "createdAt": "2026-07-28T10:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/properties/1/units"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (property not found), `409` (duplicate unit number)

---

### 3.9 Update Unit

```
PUT /api/v1/units/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "monthlyRent": 1300.00,
    "securityDeposit": 1300.00,
    "status": "AVAILABLE",
    "attributes": {
        "hasDishwasher": true,
        "hasBalcony": true
    },
    "version": 2
}
```

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Unit updated successfully",
    "data": {
        "id": 103,
        "unitNumber": "103",
        "monthlyRent": 1300.00,
        "status": "AVAILABLE",
        "version": 3,
        "updatedAt": "2026-07-28T11:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T11:00:00Z",
    "path": "/api/v1/units/103"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (not found), `409` (version conflict)

---

### 3.10 Delete Unit (Soft Delete)

```
DELETE /api/v1/units/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (204):** No content.

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (not found), `422` (unit has active lease)

---

## 4. Tenant Management APIs

### 4.1 List Tenants

```
GET /api/v1/tenants?page=0&size=20&sort=createdAt,desc
```

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `search` | `string` | Search by name, email, or phone (partial match) |
| `status` | `string` | Filter by: `ACTIVE`, `INACTIVE`, `FORMER`, `BLACKLISTED` |
| `propertyId` | `long` | Filter by associated property |

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Tenants retrieved successfully",
    "data": {
        "content": [
            {
                "id": 201,
                "firstName": "Jane",
                "lastName": "Smith",
                "email": "jane.smith@email.com",
                "phone": "+1-512-555-0101",
                "status": "ACTIVE",
                "currentLeaseId": 55,
                "currentUnitNumber": "102",
                "propertyName": "Oakwood Apartments",
                "createdAt": "2026-03-01T09:00:00Z"
            }
        ],
        "page": 0,
        "size": 20,
        "totalElements": 85,
        "totalPages": 5,
        "last": false,
        "first": true
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/tenants"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden)

---

### 4.2 Get Tenant by ID

```
GET /api/v1/tenants/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Tenant retrieved successfully",
    "data": {
        "id": 201,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@email.com",
        "phone": "+1-512-555-0101",
        "emergencyContactName": "Bob Smith",
        "emergencyContactPhone": "+1-512-555-0199",
        "dateOfBirth": "1990-05-15",
        "employer": "Tech Corp",
        "annualIncome": 85000.00,
        "preferredContactMethod": "EMAIL",
        "preferredLanguage": "en",
        "status": "ACTIVE",
        "contacts": [
            {
                "id": 1,
                "contactType": "EMAIL",
                "value": "jane.work@company.com",
                "isPrimary": false
            }
        ],
        "leaseHistory": [
            {
                "leaseId": 55,
                "propertyName": "Oakwood Apartments",
                "unitNumber": "102",
                "startDate": "2026-01-01",
                "endDate": "2026-12-31",
                "status": "ACTIVE",
                "monthlyRent": 2200.00
            }
        ],
        "documents": [
            {
                "id": 10,
                "documentType": "ID_PROOF",
                "filename": "jane_smith_id.pdf",
                "uploadedAt": "2026-01-01T10:00:00Z"
            }
        ],
        "createdAt": "2026-03-01T09:00:00Z",
        "updatedAt": "2026-07-15T16:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/tenants/201"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (not found)

---

### 4.3 Create Tenant

```
POST /api/v1/tenants
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@email.com",
    "phone": "+1-512-555-0101",
    "emergencyContactName": "Bob Smith",
    "emergencyContactPhone": "+1-512-555-0199",
    "dateOfBirth": "1990-05-15",
    "employer": "Tech Corp",
    "annualIncome": 85000.00,
    "preferredContactMethod": "EMAIL",
    "preferredLanguage": "en",
    "notes": "Prefers email communication"
}
```

**Field Validation:**

| Field | Rules |
|---|---|
| `firstName` | Required, max 100 chars |
| `lastName` | Required, max 100 chars |
| `email` | Required, valid email format |
| `phone` | Optional, encrypted at rest |
| `emergencyContactName` | Optional, encrypted at rest |
| `emergencyContactPhone` | Optional, encrypted at rest |
| `annualIncome` | Optional, min 0 |

**Success Response (201):**
```json
{
    "status": "SUCCESS",
    "code": 201,
    "message": "Tenant created successfully",
    "data": {
        "id": 201,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@email.com",
        "status": "ACTIVE",
        "createdAt": "2026-07-28T10:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/tenants"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `409` (duplicate email)

---

### 4.4 Update Tenant

```
PUT /api/v1/tenants/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "firstName": "Jane",
    "lastName": "Smith-Jones",
    "email": "jane.smith-jones@email.com",
    "phone": "+1-512-555-0202",
    "employer": "New Corp",
    "annualIncome": 95000.00,
    "preferredContactMethod": "SMS",
    "notes": "Updated contact preference",
    "version": 2
}
```

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Tenant updated successfully",
    "data": {
        "id": 201,
        "firstName": "Jane",
        "lastName": "Smith-Jones",
        "email": "jane.smith-jones@email.com",
        "version": 3,
        "updatedAt": "2026-07-28T11:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T11:00:00Z",
    "path": "/api/v1/tenants/201"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (not found), `409` (version conflict)

---

### 4.5 Delete Tenant (Soft Delete)

```
DELETE /api/v1/tenants/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (204):** No content.

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (not found), `422` (tenant has active lease)

---

### 4.6 Upload Tenant Document

```
POST /api/v1/tenants/{tenantId}/documents
```

**Headers:** `Authorization: Bearer {accessToken}`  
**Content-Type:** `multipart/form-data`

**Form Data:**

| Field | Type | Rules |
|---|---|---|
| `file` | `file` | Required, max 10 MB |
| `documentType` | `string` | Required: `LEASE_AGREEMENT`, `ID_PROOF`, `INCOME_PROOF`, `OTHER` |

**Success Response (201):**
```json
{
    "status": "SUCCESS",
    "code": 201,
    "message": "Document uploaded successfully",
    "data": {
        "id": 10,
        "documentType": "ID_PROOF",
        "filename": "jane_smith_id.pdf",
        "fileSize": 245000,
        "uploadedAt": "2026-07-28T10:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/tenants/201/documents"
}
```

**Error Codes:** `400` (validation, file too large), `401` (unauthorized), `403` (forbidden), `404` (tenant not found)

---

### 4.7 Get Tenant Documents

```
GET /api/v1/tenants/{tenantId}/documents
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Documents retrieved successfully",
    "data": [
        {
            "id": 10,
            "documentType": "ID_PROOF",
            "filename": "jane_smith_id.pdf",
            "fileSize": 245000,
            "uploadedAt": "2026-01-01T10:00:00Z"
        },
        {
            "id": 11,
            "documentType": "LEASE_AGREEMENT",
            "filename": "lease_55_signed.pdf",
            "fileSize": 512000,
            "uploadedAt": "2026-01-01T10:30:00Z"
        }
    ],
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/tenants/201/documents"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (tenant not found)

---

## 5. Lease Management APIs

### 5.1 List Leases

```
GET /api/v1/leases?page=0&size=20&sort=createdAt,desc
```

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `status` | `string` | Filter by: `DRAFT`, `ACTIVE`, `EXPIRED`, `TERMINATED`, `RENEWED` |
| `propertyId` | `long` | Filter by property |
| `unitId` | `long` | Filter by unit |
| `tenantId` | `long` | Filter by tenant |
| `expiringBefore` | `date` | Leases ending before this date (ISO 8601) |
| `expiringAfter` | `date` | Leases ending after this date (ISO 8601) |

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Leases retrieved successfully",
    "data": {
        "content": [
            {
                "id": 55,
                "leaseNumber": "LS-2026-00055",
                "propertyName": "Oakwood Apartments",
                "unitNumber": "102",
                "tenantName": "Jane Smith",
                "startDate": "2026-01-01",
                "endDate": "2026-12-31",
                "baseRent": 2200.00,
                "securityDeposit": 2200.00,
                "status": "ACTIVE",
                "daysUntilExpiry": 156,
                "createdAt": "2026-01-01T09:00:00Z"
            }
        ],
        "page": 0,
        "size": 20,
        "totalElements": 42,
        "totalPages": 3,
        "last": false,
        "first": true
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/leases"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden)

---

### 5.2 Get Lease by ID

```
GET /api/v1/leases/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Lease retrieved successfully",
    "data": {
        "id": 55,
        "leaseNumber": "LS-2026-00055",
        "propertyId": 1,
        "propertyName": "Oakwood Apartments",
        "unitId": 102,
        "unitNumber": "102",
        "tenantId": 201,
        "tenantName": "Jane Smith",
        "coTenants": [],
        "startDate": "2026-01-01",
        "endDate": "2026-12-31",
        "terminationDate": null,
        "terminationReason": null,
        "terminationPenalty": null,
        "baseRent": 2200.00,
        "securityDeposit": 2200.00,
        "rentDueDay": 1,
        "paymentFrequency": "MONTHLY",
        "status": "ACTIVE",
        "termsConditions": "Standard lease agreement terms...",
        "notes": "Tenant has a service animal.",
        "rentSchedules": [
            {
                "id": 1,
                "effectiveFrom": "2026-01-01",
                "effectiveTo": null,
                "baseRent": 2200.00,
                "escalationPercentage": null,
                "isActive": true
            }
        ],
        "securityDepositLedger": [
            {
                "id": 1,
                "entryType": "DEPOSIT",
                "amount": 2200.00,
                "balanceAfter": 2200.00,
                "description": "Initial security deposit",
                "createdAt": "2026-01-01T09:00:00Z"
            }
        ],
        "version": 3,
        "createdAt": "2026-01-01T09:00:00Z",
        "updatedAt": "2026-07-15T16:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/leases/55"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (not found)

---

### 5.3 Create Lease

```
POST /api/v1/leases
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "propertyId": 1,
    "unitId": 102,
    "tenantId": 201,
    "coTenantIds": [],
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "baseRent": 2200.00,
    "securityDeposit": 2200.00,
    "rentDueDay": 1,
    "paymentFrequency": "MONTHLY",
    "termsConditions": "Standard lease agreement terms.",
    "notes": "Tenant has a service animal.",
    "escalationPercentage": null,
    "escalationFrequencyMonths": null
}
```

**Field Validation:**

| Field | Rules |
|---|---|
| `propertyId` | Required, must reference existing property |
| `unitId` | Required, must reference existing unit in that property |
| `tenantId` | Required, must reference existing tenant |
| `startDate` | Required, must be in the future |
| `endDate` | Required, must be after start date |
| `baseRent` | Required, min 0.01 |
| `securityDeposit` | Required, min 0 |
| `rentDueDay` | Required, 1–28 |
| `coTenantIds` | Optional array, each must reference existing tenant |

**Business Validations (return 422):**
- Unit must not have overlapping active lease
- Tenant must not have overlapping active lease
- Unit must be in AVAILABLE status
- Tenant must be in ACTIVE status

**Success Response (201):**
```json
{
    "status": "SUCCESS",
    "code": 201,
    "message": "Lease created successfully",
    "data": {
        "id": 55,
        "leaseNumber": "LS-2026-00055",
        "unitId": 102,
        "tenantId": 201,
        "startDate": "2026-01-01",
        "endDate": "2026-12-31",
        "baseRent": 2200.00,
        "status": "ACTIVE",
        "createdAt": "2026-07-28T10:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/leases"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (referenced entity not found), `422` (business rule violation: overlap, status conflict)

---

### 5.4 Update Lease Terms

```
PUT /api/v1/leases/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "baseRent": 2300.00,
    "endDate": "2027-01-01",
    "notes": "Extended lease term with rent adjustment",
    "version": 3
}
```

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Lease updated successfully",
    "data": {
        "id": 55,
        "leaseNumber": "LS-2026-00055",
        "baseRent": 2300.00,
        "endDate": "2027-01-01",
        "status": "ACTIVE",
        "version": 4,
        "updatedAt": "2026-07-28T11:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T11:00:00Z",
    "path": "/api/v1/leases/55"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (not found), `409` (version conflict), `422` (business rule)

---

### 5.5 Terminate Lease (Early)

```
POST /api/v1/leases/{id}/terminate
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "terminationDate": "2026-09-30",
    "reason": "Tenant relocation",
    "penalty": 500.00,
    "version": 3
}
```

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Lease terminated successfully",
    "data": {
        "id": 55,
        "leaseNumber": "LS-2026-00055",
        "endDate": "2026-09-30",
        "terminationDate": "2026-09-30",
        "terminationReason": "Tenant relocation",
        "terminationPenalty": 500.00,
        "status": "TERMINATED",
        "version": 4,
        "updatedAt": "2026-07-28T11:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T11:00:00Z",
    "path": "/api/v1/leases/55/terminate"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (not found), `409` (version conflict), `422` (lease not ACTIVE)

---

### 5.6 Renew Lease

```
POST /api/v1/leases/{id}/renew
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "newEndDate": "2027-12-31",
    "newBaseRent": 2350.00,
    "escalationPercentage": 3.0,
    "escalationFrequencyMonths": 12,
    "notes": "Annual renewal with 3% escalation",
    "version": 3
}
```

**Success Response (201):**
> Creates a NEW lease record (old one has status = RENEWED).

```json
{
    "status": "SUCCESS",
    "code": 201,
    "message": "Lease renewed successfully",
    "data": {
        "id": 88,
        "leaseNumber": "LS-2027-00088",
        "previousLeaseId": 55,
        "unitId": 102,
        "tenantId": 201,
        "startDate": "2027-01-01",
        "endDate": "2027-12-31",
        "baseRent": 2350.00,
        "status": "ACTIVE",
        "createdAt": "2026-07-28T11:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T11:00:00Z",
    "path": "/api/v1/leases/55/renew"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (not found), `409` (version conflict), `422` (lease not ACTIVE, end date already passed)

---

### 5.7 Get Lease Rent Schedules

```
GET /api/v1/leases/{leaseId}/rent-schedules
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Rent schedules retrieved",
    "data": [
        {
            "id": 1,
            "effectiveFrom": "2026-01-01",
            "effectiveTo": null,
            "baseRent": 2200.00,
            "escalationPercentage": null,
            "escalationFrequencyMonths": null,
            "discountPercentage": null,
            "discountDescription": null,
            "isActive": true
        }
    ],
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/leases/55/rent-schedules"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (lease not found)

---

### 5.8 Add Rent Schedule

```
POST /api/v1/leases/{leaseId}/rent-schedules
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "effectiveFrom": "2027-01-01",
    "baseRent": 2350.00,
    "escalationPercentage": 3.0,
    "escalationFrequencyMonths": 12,
    "discountPercentage": null,
    "discountDescription": null
}
```

**Success Response (201):**
```json
{
    "status": "SUCCESS",
    "code": 201,
    "message": "Rent schedule added",
    "data": {
        "id": 2,
        "effectiveFrom": "2027-01-01",
        "baseRent": 2350.00,
        "isActive": true
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/leases/55/rent-schedules"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (lease not found), `409` (duplicate effective date)

---

## 6. Rent Collection APIs

### 6.1 List Invoices

```
GET /api/v1/invoices?page=0&size=20&sort=dueDate,asc
```

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `status` | `string` | Filter by: `PENDING`, `PARTIALLY_PAID`, `PAID`, `OVERPAID`, `CANCELLED`, `REFUNDED` |
| `leaseId` | `long` | Filter by lease |
| `tenantId` | `long` | Filter by tenant |
| `propertyId` | `long` | Filter by property |
| `dueBefore` | `date` | Due on or before this date |
| `dueAfter` | `date` | Due on or after this date |
| `overdue` | `boolean` | `true` = only overdue invoices |

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Invoices retrieved successfully",
    "data": {
        "content": [
            {
                "id": 1001,
                "invoiceNumber": "INV-2026-08-00001",
                "leaseId": 55,
                "tenantName": "Jane Smith",
                "unitNumber": "102",
                "propertyName": "Oakwood Apartments",
                "periodStart": "2026-08-01",
                "periodEnd": "2026-08-31",
                "dueDate": "2026-08-05",
                "baseAmount": 2200.00,
                "lateFeeAmount": 0.00,
                "discountAmount": 0.00,
                "totalAmount": 2200.00,
                "paidAmount": 0.00,
                "balanceDue": 2200.00,
                "status": "PENDING",
                "daysOverdue": null,
                "createdAt": "2026-08-01T00:00:00Z"
            }
        ],
        "page": 0,
        "size": 20,
        "totalElements": 200,
        "totalPages": 10,
        "last": false,
        "first": true
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/invoices"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden)

---

### 6.2 Get Invoice by ID

```
GET /api/v1/invoices/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Invoice retrieved successfully",
    "data": {
        "id": 1001,
        "invoiceNumber": "INV-2026-08-00001",
        "leaseId": 55,
        "unitId": 102,
        "tenantId": 201,
        "tenantName": "Jane Smith",
        "periodStart": "2026-08-01",
        "periodEnd": "2026-08-31",
        "dueDate": "2026-08-05",
        "baseAmount": 2200.00,
        "lateFeeAmount": 0.00,
        "discountAmount": 0.00,
        "adjustmentAmount": 0.00,
        "totalAmount": 2200.00,
        "paidAmount": 0.00,
        "balanceDue": 2200.00,
        "status": "PENDING",
        "notes": null,
        "version": 1,
        "payments": [],
        "createdAt": "2026-08-01T00:00:00Z",
        "updatedAt": "2026-08-01T00:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/invoices/1001"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (not found)

---

### 6.3 Generate Invoices Manually

```
POST /api/v1/invoices/generate
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "leaseIds": [55, 56, 57],
    "periodStart": "2026-08-01",
    "periodEnd": "2026-08-31",
    "dueDate": "2026-08-05"
}
```

**Success Response (201):**
```json
{
    "status": "SUCCESS",
    "code": 201,
    "message": "3 invoices generated successfully",
    "data": {
        "generatedCount": 3,
        "skippedCount": 0,
        "invoiceIds": [1001, 1002, 1003]
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/invoices/generate"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `422` (invoices already exist for period)

---

### 6.4 Record Payment

```
POST /api/v1/payments
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "invoiceId": 1001,
    "amount": 2200.00,
    "paymentDate": "2026-08-03",
    "paymentMethod": "BANK_TRANSFER",
    "referenceNumber": "WTX-20260803-98765",
    "notes": "Online payment via tenant portal"
}
```

**Field Validation:**

| Field | Rules |
|---|---|
| `invoiceId` | Required, must reference existing PENDING/PARTIALLY_PAID invoice |
| `amount` | Required, min 0.01, max = invoice balance_due |
| `paymentDate` | Required, cannot be in the future |
| `paymentMethod` | Required: `CASH`, `CHECK`, `BANK_TRANSFER`, `CREDIT_CARD`, `ONLINE` |

**Success Response (201):**
```json
{
    "status": "SUCCESS",
    "code": 201,
    "message": "Payment recorded successfully",
    "data": {
        "id": 5001,
        "paymentNumber": "PAY-2026-08-00001",
        "invoiceId": 1001,
        "amount": 2200.00,
        "paymentDate": "2026-08-03",
        "paymentMethod": "BANK_TRANSFER",
        "status": "COMPLETED",
        "invoiceStatusAfter": "PAID",
        "receiptId": 9001,
        "receiptNumber": "RCT-2026-08-00001",
        "createdAt": "2026-08-03T10:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-08-03T10:30:00Z",
    "path": "/api/v1/payments"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (invoice not found), `422` (payment exceeds balance, invoice already PAID)

---

### 6.5 Get Payment by ID

```
GET /api/v1/payments/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Payment retrieved successfully",
    "data": {
        "id": 5001,
        "paymentNumber": "PAY-2026-08-00001",
        "invoiceId": 1001,
        "invoiceNumber": "INV-2026-08-00001",
        "tenantName": "Jane Smith",
        "amount": 2200.00,
        "paymentDate": "2026-08-03",
        "paymentMethod": "BANK_TRANSFER",
        "referenceNumber": "WTX-20260803-98765",
        "notes": "Online payment via tenant portal",
        "status": "COMPLETED",
        "reconciled": false,
        "createdAt": "2026-08-03T10:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/payments/5001"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (not found)

---

### 6.6 List Payments

```
GET /api/v1/payments?page=0&size=20&sort=paymentDate,desc
```

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `invoiceId` | `long` | Filter by invoice |
| `tenantId` | `long` | Filter by tenant |
| `paymentMethod` | `string` | Filter by method |
| `dateFrom` | `date` | Payments on or after this date |
| `dateTo` | `date` | Payments on or before this date |

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Payments retrieved successfully",
    "data": {
        "content": [
            {
                "id": 5001,
                "paymentNumber": "PAY-2026-08-00001",
                "invoiceNumber": "INV-2026-08-00001",
                "tenantName": "Jane Smith",
                "amount": 2200.00,
                "paymentDate": "2026-08-03",
                "paymentMethod": "BANK_TRANSFER",
                "status": "COMPLETED"
            }
        ],
        "page": 0,
        "size": 20,
        "totalElements": 150,
        "totalPages": 8,
        "last": false,
        "first": true
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/payments"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden)

---

### 6.7 Get Invoice Receipt

```
GET /api/v1/receipts/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Receipt retrieved successfully",
    "data": {
        "id": 9001,
        "receiptNumber": "RCT-2026-08-00001",
        "paymentId": 5001,
        "invoiceId": 1001,
        "invoiceNumber": "INV-2026-08-00001",
        "tenantName": "Jane Smith",
        "unitNumber": "102",
        "propertyName": "Oakwood Apartments",
        "receiptData": {
            "payment": {
                "amount": 2200.00,
                "method": "BANK_TRANSFER",
                "reference": "WTX-20260803-98765",
                "date": "2026-08-03"
            },
            "invoice": {
                "number": "INV-2026-08-00001",
                "period": "August 2026",
                "baseAmount": 2200.00,
                "lateFee": 0.00,
                "totalDue": 2200.00,
                "balanceAfter": 0.00
            },
            "property": {
                "name": "Oakwood Apartments",
                "address": "123 Main St, Austin, TX 78701"
            }
        },
        "generatedAt": "2026-08-03T10:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/receipts/9001"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (not found)

---

### 6.8 Get Aging Report

```
GET /api/v1/reports/aging?propertyId=1
```

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `propertyId` | `long` | Filter by property (optional, portfolio-wide if omitted) |
| `asOfDate` | `date` | Report date (defaults to today) |

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Aging report generated",
    "data": {
        "propertyId": 1,
        "propertyName": "Oakwood Apartments",
        "asOfDate": "2026-07-28",
        "summary": {
            "totalOutstanding": 12500.00,
            "totalInvoices": 18,
            "buckets": {
                "current": {
                    "amount": 8500.00,
                    "invoiceCount": 12,
                    "percentage": 68.0
                },
                "days1to30": {
                    "amount": 2200.00,
                    "invoiceCount": 3,
                    "percentage": 17.6
                },
                "days31to60": {
                    "amount": 1000.00,
                    "invoiceCount": 2,
                    "percentage": 8.0
                },
                "days61to90": {
                    "amount": 800.00,
                    "invoiceCount": 1,
                    "percentage": 6.4
                },
                "days90plus": {
                    "amount": 0.00,
                    "invoiceCount": 0,
                    "percentage": 0.0
                }
            }
        },
        "details": [
            {
                "invoiceNumber": "INV-2026-06-00001",
                "tenantName": "John Johnson",
                "unitNumber": "201",
                "dueDate": "2026-06-05",
                "totalAmount": 1800.00,
                "balanceDue": 1800.00,
                "daysOverdue": 53,
                "bucket": "days31to60"
            }
        ]
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/reports/aging?propertyId=1"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (property not found)

---

### 6.9 Apply Late Fees (Manual Trigger)

```
POST /api/v1/invoices/apply-late-fees
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "asOfDate": "2026-08-10",
    "propertyId": 1
}
```

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Late fees applied successfully",
    "data": {
        "invoicesUpdated": 3,
        "totalLateFeeAmount": 150.00,
        "details": [
            {
                "invoiceId": 1005,
                "invoiceNumber": "INV-2026-07-00005",
                "lateFeeApplied": 75.00,
                "newTotal": 1875.00
            }
        ]
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/invoices/apply-late-fees"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden)

---

## 7. Maintenance Tickets APIs

### 7.1 List Tickets

```
GET /api/v1/tickets?page=0&size=20&sort=createdAt,desc
```

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `status` | `string` | Filter by: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REOPENED` |
| `priority` | `string` | Filter by: `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `propertyId` | `long` | Filter by property |
| `unitId` | `long` | Filter by unit |
| `assigneeId` | `long` | Filter by assignee |
| `category` | `string` | Filter by category |
| `slaBreached` | `boolean` | `true` = only breached SLA tickets |

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Tickets retrieved successfully",
    "data": {
        "content": [
            {
                "id": 301,
                "ticketNumber": "TK-2026-00301",
                "title": "Water leak in kitchen sink",
                "category": "PLUMBING",
                "priority": "URGENT",
                "status": "ASSIGNED",
                "unitNumber": "102",
                "propertyName": "Oakwood Apartments",
                "reporterName": "Jane Smith",
                "assigneeName": "Mike Plumber",
                "createdAt": "2026-07-28T08:00:00Z",
                "slaDeadline": "2026-07-28T12:00:00Z",
                "slaBreached": false,
                "ageHours": 2.5
            }
        ],
        "page": 0,
        "size": 20,
        "totalElements": 45,
        "totalPages": 3,
        "last": false,
        "first": true
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/tickets"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden)

---

### 7.2 Get Ticket by ID

```
GET /api/v1/tickets/{id}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Ticket retrieved successfully",
    "data": {
        "id": 301,
        "ticketNumber": "TK-2026-00301",
        "unitId": 102,
        "unitNumber": "102",
        "propertyId": 1,
        "propertyName": "Oakwood Apartments",
        "reporterId": 201,
        "reporterName": "Jane Smith",
        "assigneeId": 75,
        "assigneeName": "Mike Plumber",
        "vendorId": 5,
        "vendorName": "ABC Plumbing Inc.",
        "title": "Water leak in kitchen sink",
        "description": "Water is leaking from under the kitchen sink. There is standing water in the cabinet.",
        "category": "PLUMBING",
        "priority": "URGENT",
        "status": "ASSIGNED",
        "slaDeadline": "2026-07-28T12:00:00Z",
        "slaBreached": false,
        "slaBreachedAt": null,
        "resolvedAt": null,
        "closedAt": null,
        "resolutionNotes": null,
        "cost": null,
        "assignmentHistory": [
            {
                "id": 1,
                "assignedTo": "Mike Plumber",
                "assignedBy": "John Doe",
                "assignedAt": "2026-07-28T09:00:00Z",
                "assignmentNote": "Emergency - address immediately"
            }
        ],
        "comments": [
            {
                "id": "mongo-comment-id",
                "authorName": "Jane Smith",
                "authorRole": "TENANT",
                "body": "The leak is getting worse! Please send someone ASAP.",
                "createdAt": "2026-07-28T08:30:00Z"
            }
        ],
        "attachments": [
            {
                "id": 50,
                "filename": "leak_photo.jpg",
                "fileSize": 1024000,
                "uploadedAt": "2026-07-28T08:00:00Z"
            }
        ],
        "version": 2,
        "createdAt": "2026-07-28T08:00:00Z",
        "updatedAt": "2026-07-28T09:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/tickets/301"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (not found)

---

### 7.3 Create Ticket

```
POST /api/v1/tickets
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "unitId": 102,
    "title": "Water leak in kitchen sink",
    "description": "Water is leaking from under the kitchen sink.",
    "category": "PLUMBING",
    "priority": "URGENT"
}
```

**Field Validation:**

| Field | Rules |
|---|---|
| `unitId` | Required, must reference existing unit |
| `title` | Required, max 200 chars |
| `description` | Required, max 5000 chars |
| `category` | Required: `PLUMBING`, `ELECTRICAL`, `HVAC`, `APPLIANCE`, `STRUCTURAL`, `PEST`, `OTHER` |
| `priority` | Required: `LOW`, `MEDIUM`, `HIGH`, `URGENT` |

**Success Response (201):**
```json
{
    "status": "SUCCESS",
    "code": 201,
    "message": "Ticket created successfully",
    "data": {
        "id": 301,
        "ticketNumber": "TK-2026-00301",
        "title": "Water leak in kitchen sink",
        "priority": "URGENT",
        "status": "OPEN",
        "slaDeadline": "2026-07-28T12:00:00Z",
        "createdAt": "2026-07-28T08:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T08:00:00Z",
    "path": "/api/v1/tickets"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (unit not found)

---

### 7.4 Update Ticket Status

```
PUT /api/v1/tickets/{id}/status
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "status": "IN_PROGRESS",
    "version": 1
}
```

**Allowed Status Transitions:**

| From → To | Allowed Roles |
|---|---|
| OPEN → ASSIGNED | `ADMIN`, `PROPERTY_MANAGER` |
| ASSIGNED → IN_PROGRESS | `ADMIN`, `PROPERTY_MANAGER`, `VENDOR` |
| IN_PROGRESS → RESOLVED | `ADMIN`, `PROPERTY_MANAGER`, `VENDOR` |
| RESOLVED → CLOSED | `ADMIN`, `PROPERTY_MANAGER` |
| CLOSED → REOPENED | `ADMIN`, `PROPERTY_MANAGER`, `TENANT` |

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Ticket status updated",
    "data": {
        "id": 301,
        "ticketNumber": "TK-2026-00301",
        "status": "IN_PROGRESS",
        "version": 2,
        "updatedAt": "2026-07-28T09:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T09:30:00Z",
    "path": "/api/v1/tickets/301/status"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (not found), `409` (version conflict), `422` (invalid status transition)

---

### 7.5 Assign Ticket

```
POST /api/v1/tickets/{id}/assign
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "assigneeId": 75,
    "assignmentNote": "Emergency - address immediately"
}
```

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Ticket assigned successfully",
    "data": {
        "id": 301,
        "assigneeName": "Mike Plumber",
        "status": "ASSIGNED",
        "version": 2,
        "updatedAt": "2026-07-28T09:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T09:00:00Z",
    "path": "/api/v1/tickets/301/assign"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (not found), `409` (version conflict)

---

### 7.6 Add Comment to Ticket

```
POST /api/v1/tickets/{ticketId}/comments
```

**Headers:** `Authorization: Bearer {accessToken}`  
**Content-Type:** `multipart/form-data`

**Form Data:**

| Field | Type | Rules |
|---|---|---|
| `body` | `string` | Required, max 10000 chars |
| `isInternal` | `boolean` | Optional, default `false` |
| `attachments` | `file[]` | Optional, max 5 files, max 10 MB each |

**Success Response (201):**
```json
{
    "status": "SUCCESS",
    "code": 201,
    "message": "Comment added successfully",
    "data": {
        "id": "mongo-comment-id",
        "authorName": "Mike Plumber",
        "authorRole": "VENDOR",
        "body": "Arrived on site. Replacing the pipe. Will be done in 2 hours.",
        "isInternal": false,
        "attachments": [],
        "createdAt": "2026-07-28T10:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:00:00Z",
    "path": "/api/v1/tickets/301/comments"
}
```

**Error Codes:** `400` (validation, file too large), `401` (unauthorized), `403` (forbidden), `404` (ticket not found)

---

### 7.7 Get Ticket Comments

```
GET /api/v1/tickets/{ticketId}/comments?page=0&size=50
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Comments retrieved successfully",
    "data": {
        "content": [
            {
                "id": "mongo-comment-1",
                "authorName": "Jane Smith",
                "authorRole": "TENANT",
                "body": "The leak is getting worse!",
                "isInternal": false,
                "attachments": [],
                "createdAt": "2026-07-28T08:30:00Z"
            },
            {
                "id": "mongo-comment-2",
                "authorName": "John Doe",
                "authorRole": "PROPERTY_MANAGER",
                "body": "Vendor has been dispatched.",
                "isInternal": true,
                "attachments": [],
                "createdAt": "2026-07-28T09:00:00Z"
            }
        ],
        "page": 0,
        "size": 50,
        "totalElements": 2,
        "totalPages": 1,
        "last": true,
        "first": true
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/tickets/301/comments"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (ticket not found)

---

### 7.8 List Vendors

```
GET /api/v1/vendors?page=0&size=20&sort=name,asc
```

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `tradeSpecialty` | `string` | Filter by specialty |
| `status` | `string` | Filter by: `ACTIVE`, `INACTIVE`, `BLACKLISTED` |
| `search` | `string` | Search by name or contact |

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Vendors retrieved successfully",
    "data": {
        "content": [
            {
                "id": 5,
                "name": "ABC Plumbing Inc.",
                "contactName": "Mike Johnson",
                "email": "mike@abcplumbing.com",
                "phone": "+1-512-555-0300",
                "tradeSpecialty": "PLUMBING",
                "hourlyRate": 85.00,
                "rating": 4.5,
                "status": "ACTIVE",
                "completedJobs": 47
            }
        ],
        "page": 0,
        "size": 20,
        "totalElements": 12,
        "totalPages": 1,
        "last": true,
        "first": true
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/vendors"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden)

---

### 7.9 Create Vendor

```
POST /api/v1/vendors
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "name": "ABC Plumbing Inc.",
    "contactName": "Mike Johnson",
    "email": "mike@abcplumbing.com",
    "phone": "+1-512-555-0300",
    "tradeSpecialty": "PLUMBING",
    "hourlyRate": 85.00,
    "insuranceProof": true,
    "notes": "Preferred vendor for Oakwood properties"
}
```

**Success Response (201):**
```json
{
    "status": "SUCCESS",
    "code": 201,
    "message": "Vendor created successfully",
    "data": {
        "id": 5,
        "name": "ABC Plumbing Inc.",
        "tradeSpecialty": "PLUMBING",
        "status": "ACTIVE",
        "createdAt": "2026-07-28T10:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/vendors"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden)

---

### 7.10 Resolve Ticket

```
POST /api/v1/tickets/{id}/resolve
```

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
    "resolutionNotes": "Replaced the faulty pipe under the sink. Tested for leaks - all clear.",
    "cost": 250.00,
    "version": 3
}
```

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Ticket resolved successfully",
    "data": {
        "id": 301,
        "ticketNumber": "TK-2026-00301",
        "status": "RESOLVED",
        "resolvedAt": "2026-07-28T12:00:00Z",
        "resolutionNotes": "Replaced the faulty pipe under the sink.",
        "cost": 250.00,
        "version": 4,
        "updatedAt": "2026-07-28T12:00:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T12:00:00Z",
    "path": "/api/v1/tickets/301/resolve"
}
```

**Error Codes:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (not found), `409` (version conflict), `422` (invalid state: must be IN_PROGRESS)

---

## 8. Dashboard APIs

### 8.1 Get Portfolio Dashboard

```
GET /api/v1/dashboard/portfolio
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Portfolio dashboard retrieved",
    "data": {
        "occupancy": {
            "totalUnits": 500,
            "availableUnits": 65,
            "rentedUnits": 410,
            "maintenanceUnits": 25,
            "occupancyRate": 82.0,
            "trend": "+2.5%",
            "occupancyByProperty": [
                { "propertyId": 1, "propertyName": "Oakwood", "rate": 85.0 },
                { "propertyId": 2, "propertyName": "Maple Gardens", "rate": 78.0 }
            ]
        },
        "financial": {
            "totalCollectedMTD": 425000.00,
            "totalOutstanding": 52500.00,
            "collectionRate": 89.0,
            "delinquencyRate": 11.0,
            "delinquencyBuckets": {
                "days1to30": 25000.00,
                "days31to60": 15000.00,
                "days61to90": 8500.00,
                "days90plus": 4000.00
            },
            "revenueTrend": [
                { "month": "2026-01", "amount": 410000.00 },
                { "month": "2026-02", "amount": 415000.00 },
                { "month": "2026-03", "amount": 422000.00 }
            ]
        },
        "maintenance": {
            "openTickets": 35,
            "avgResolutionHours": 18.5,
            "breachedSLA": 5,
            "urgentTickets": 3,
            "ticketsByPriority": {
                "LOW": 8,
                "MEDIUM": 15,
                "HIGH": 9,
                "URGENT": 3
            },
            "ticketsByCategory": {
                "PLUMBING": 10,
                "ELECTRICAL": 7,
                "HVAC": 5,
                "APPLIANCE": 8,
                "STRUCTURAL": 3,
                "PEST": 1,
                "OTHER": 1
            }
        },
        "leaseExpiry": {
            "expiringIn30Days": 5,
            "expiringIn60Days": 12,
            "expiringIn90Days": 18,
            "expiringSoon": [
                {
                    "leaseId": 55,
                    "tenantName": "Jane Smith",
                    "unitNumber": "102",
                    "propertyName": "Oakwood Apartments",
                    "endDate": "2026-12-31",
                    "daysRemaining": 156
                }
            ]
        },
        "alerts": [
            {
                "severity": "CRITICAL",
                "type": "SLA_BREACHED",
                "message": "URGENT ticket #TK-301 has breached SLA",
                "ticketId": 301,
                "createdAt": "2026-07-28T12:00:00Z"
            },
            {
                "severity": "WARNING",
                "type": "OVERDUE_INVOICE",
                "message": "Invoice #INV-2026-06-00001 is 53 days overdue",
                "invoiceId": 1005,
                "amount": 1800.00,
                "daysOverdue": 53,
                "createdAt": "2026-07-28T12:00:00Z"
            }
        ],
        "computedAt": "2026-07-28T10:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/dashboard/portfolio"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden)

---

### 8.2 Get Property Dashboard

```
GET /api/v1/dashboard/property/{propertyId}
```

**Headers:** `Authorization: Bearer {accessToken}`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Property dashboard retrieved",
    "data": {
        "propertyId": 1,
        "propertyName": "Oakwood Apartments",
        "occupancy": {
            "totalUnits": 20,
            "availableUnits": 3,
            "rentedUnits": 15,
            "maintenanceUnits": 2,
            "occupancyRate": 75.0
        },
        "financial": {
            "totalCollectedMTD": 33000.00,
            "totalOutstanding": 4500.00,
            "collectionRate": 88.0,
            "overdueInvoices": [
                {
                    "invoiceNumber": "INV-2026-07-00005",
                    "tenantName": "Bob Tenant",
                    "unitNumber": "205",
                    "dueDate": "2026-07-05",
                    "balanceDue": 1500.00
                }
            ]
        },
        "maintenance": {
            "openTickets": 8,
            "avgResolutionHours": 16.2,
            "breachedSLA": 2
        },
        "leaseExpiry": {
            "expiringIn30Days": 0,
            "expiringIn60Days": 1,
            "expiringIn90Days": 3
        },
        "computedAt": "2026-07-28T10:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/dashboard/property/1"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden), `404` (property not found)

---

### 8.3 Get Tenant Self-Service Dashboard

```
GET /api/v1/dashboard/me
```

**Headers:** `Authorization: Bearer {accessToken}`  
**Required Role:** `TENANT`

**Success Response (200):**
```json
{
    "status": "SUCCESS",
    "code": 200,
    "message": "Dashboard retrieved",
    "data": {
        "profile": {
            "id": 201,
            "name": "Jane Smith",
            "email": "jane.smith@email.com",
            "phone": "+1-512-555-0101"
        },
        "currentLease": {
            "id": 55,
            "leaseNumber": "LS-2026-00055",
            "unitNumber": "102",
            "propertyName": "Oakwood Apartments",
            "startDate": "2026-01-01",
            "endDate": "2026-12-31",
            "status": "ACTIVE",
            "daysUntilExpiry": 156
        },
        "currentInvoice": {
            "id": 1001,
            "invoiceNumber": "INV-2026-08-00001",
            "period": "August 2026",
            "dueDate": "2026-08-05",
            "totalAmount": 2200.00,
            "paidAmount": 0.00,
            "balanceDue": 2200.00,
            "status": "PENDING"
        },
        "openTickets": [
            {
                "id": 301,
                "ticketNumber": "TK-2026-00301",
                "title": "Water leak in kitchen sink",
                "priority": "URGENT",
                "status": "ASSIGNED",
                "createdAt": "2026-07-28T08:00:00Z"
            }
        ],
        "paymentHistory": [
            {
                "paymentNumber": "PAY-2026-07-00001",
                "amount": 2200.00,
                "paymentDate": "2026-07-03",
                "paymentMethod": "BANK_TRANSFER",
                "status": "COMPLETED"
            }
        ],
        "alerts": [
            {
                "type": "LEASE_EXPIRING",
                "message": "Your lease expires in 156 days. Contact your manager for renewal.",
                "createdAt": "2026-07-28T00:00:00Z"
            }
        ],
        "computedAt": "2026-07-28T10:30:00Z"
    },
    "errors": null,
    "timestamp": "2026-07-28T10:30:00Z",
    "path": "/api/v1/dashboard/me"
}
```

**Error Codes:** `401` (unauthorized), `403` (forbidden — only TENANT role)

---

### 8.4 Health Check Endpoints

```
GET /api/v1/health/liveness
```

**Success Response (200):**
```json
{
    "status": "UP"
}
```

```
GET /api/v1/health/readiness
```

**Success Response (200):**
```json
{
    "status": "UP",
    "components": {
        "postgresql": { "status": "UP", "details": { "database": "smartlease", "validationQuery": "ok" } },
        "mongodb": { "status": "UP", "details": { "database": "smartlease" } }
    }
}
```

---

> *This API contract is the authoritative reference for all SmartLease REST endpoints.*  
> *For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).*  
> *For database schema, see [DATABASE.md](./DATABASE.md).*  
> *For business requirements, see [REQUIREMENTS.md](./REQUIREMENTS.md).*  
> *For project context, see [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).*
