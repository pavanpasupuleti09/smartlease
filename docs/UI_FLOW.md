# SmartLease — UI/UX Flow Document

> **User Interface Navigation & Page Flow Specification**  
> *Version 1.0* | *Framework: Bootstrap 5 + Thymeleaf* | *Layout: Responsive*

---

## Table of Contents

1. [Application Layout](#1-application-layout)
2. [Navigation Structure](#2-navigation-structure)
3. [Login & Registration Flow](#3-login--registration-flow)
4. [Dashboard Pages](#4-dashboard-pages)
5. [Property Management Pages](#5-property-management-pages)
6. [Tenant Management Pages](#6-tenant-management-pages)
7. [Lease Management Pages](#7-lease-management-pages)
8. [Rent Collection Pages](#8-rent-collection-pages)
9. [Maintenance Tickets Pages](#9-maintenance-tickets-pages)
10. [Responsive Layout Breakpoints](#10-responsive-layout-breakpoints)

---

## 1. Application Layout

### 1.1 Authenticated Layout (Default)

```
┌─────────────────────────────────────────────────────────────────────┐
│  TOP NAVBAR                                                          │
│  ┌──────┬──────────────────────────────────────────────────────┐    │
│  │☰ Menu│  SmartLease                    [🔔] [👤 John Doe ▼]  │    │
│  └──────┴──────────────────────────────────────────────────────┘    │
├──────────┬──────────────────────────────────────────────────────────┤
│  SIDEBAR  │  MAIN CONTENT AREA                                      │
│           │                                                          │
│  ●─── Dashboard │  ┌───────────────────────────────────────────┐    │
│  ●─── Properties│  │  Page Header + Breadcrumb                 │    │
│  ●─── Tenants   │  ├───────────────────────────────────────────┤    │
│  ●─── Leases    │  │  Content (Table / Cards / Form / Detail)  │    │
│  ●─── Rent      │  │                                           │    │
│  ●─── Maint.    │  │                                           │    │
│  ●─── Reports   │  │                                           │    │
│           │     │  │                                           │    │
│  ───────────────│  │                                           │    │
│  👤 My Profile  │  │                                           │    │
│  ⚙️ Settings    │  │                                           │    │
│  🚪 Logout      │  │                                           │    │
│           │     │  └───────────────────────────────────────────┘    │
├──────────┴──────────────────────────────────────────────────────────┤
│  FOOTER: © 2026 SmartLease v1.0                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Layout Components

| Component | Description | Behavior |
|---|---|---|
| **Top Navbar** | Fixed height (56px). Logo, search bar, notification bell, user dropdown. | Stays fixed on scroll |
| **Sidebar** | 250px wide. Collapsible to icons-only (64px). Module navigation. | Sticky, scrolls independently |
| **Main Content** | Flexible area. Contains page header + page content. | Scrollable |
| **Footer** | Version info, copyright. | Static bottom |

### 1.3 Role-Based Sidebar Visibility

```
Sidebar Menu Item         │ ADMIN │ PROP_MGR │ TENANT │ VENDOR │ VIEWER
──────────────────────────┼───────┼──────────┼────────┼────────┼────────
Dashboard (Portfolio)     │   ✅  │    ✅    │   ❌   │   ❌   │   ✅
Dashboard (My View)       │   ✅  │    ✅    │   ✅   │   ✅   │   ❌
Properties                │   ✅  │    ✅    │   ❌   │   ❌   │   ✅
Tenants                   │   ✅  │    ✅    │   ❌   │   ❌   │   ❌
Leases                    │   ✅  │    ✅    │   ✅*  │   ❌   │   ✅
Rent / Invoices           │   ✅  │    ✅    │   ✅*  │   ❌   │   ✅
Maintenance Tickets       │   ✅  │    ✅    │   ✅*  │   ✅*  │   ❌
Vendors                   │   ✅  │    ✅    │   ❌   │   ❌   │   ❌
User Management (Admin)   │   ✅  │    ❌    │   ❌   │   ❌   │   ❌
Reports                   │   ✅  │    ✅    │   ❌   │   ❌   │   ❌

(* = self-service only: own lease, own invoices, own tickets)
```

---

## 2. Navigation Structure

### 2.1 Site Map

```
┌─ Home (/) ──────────────────────────────────────────────────┐
│                                                               │
├── 🔐 Auth (Unauthenticated)                                   │
│   ├── /login               → Login form                       │
│   ├── /register            → Registration form                │
│   ├── /forgot-password     → Email input for reset            │
│   ├── /reset-password      → New password form (token in URL) │
│   └── /error/*             → 404, 500, access-denied          │
│                                                               │
├── 📊 Dashboard                                                │
│   ├── /dashboard           → Portfolio dashboard (ADMIN/MGR)  │
│   ├── /dashboard/property/{id} → Single property dashboard   │
│   └── /dashboard/me        → Tenant self-service dashboard   │
│                                                               │
├── 🏢 Properties                                               │
│   ├── /properties          → Property list (table + map)     │
│   ├── /properties/create   → New property form                │
│   ├── /properties/{id}     → Property detail                  │
│   └── /properties/{id}/edit → Edit property form              │
│       └── /properties/{id}/units → Units tab within detail   │
│           ├── /units/{id}  → Unit detail + lease history     │
│           ├── /properties/{id}/units/create → Add unit form  │
│           └── /units/{id}/edit → Edit unit form              │
│                                                               │
├── 👥 Tenants                                                 │
│   ├── /tenants             → Tenant list (table)             │
│   ├── /tenants/create      → New tenant form                 │
│   ├── /tenants/{id}        → Tenant detail + lease history   │
│   └── /tenants/{id}/edit   → Edit tenant form                │
│       └── /tenants/{id}/documents → Documents tab            │
│                                                               │
├── 📝 Leases                                                  │
│   ├── /leases              → Lease list (table)              │
│   ├── /leases/create       → New lease form (wizard)         │
│   ├── /leases/{id}         → Lease detail                    │
│   └── /leases/{id}/edit    → Edit lease terms                │
│       ├── /leases/{id}/terminate → Termination form          │
│       ├── /leases/{id}/renew → Renewal form                  │
│       └── /leases/{id}/rent-schedules → Rent schedules table │
│                                                               │
├── 💰 Rent & Invoices                                         │
│   ├── /invoices            → Invoice list (table)            │
│   ├── /invoices/{id}       → Invoice detail                  │
│   ├── /payments            → Payment list                    │
│   ├── /payments/create     → Record payment form             │
│   ├── /receipts/{id}       → Receipt view (printable)        │
│   ├── /reports/aging       → Aging report                    │
│   └── /reports/collection  → Collection summary              │
│                                                               │
├── 🔧 Maintenance                                             │
│   ├── /tickets             → Ticket list (table)             │
│   ├── /tickets/create      → New ticket form                 │
│   ├── /tickets/{id}        → Ticket detail + comments        │
│   └── /tickets/{id}/edit   → Edit ticket                    │
│       ├── /vendors         → Vendor directory list           │
│       └── /vendors/create  → New vendor form                 │
│                                                               │
├── ⚙️ Admin                                                   │
│   ├── /admin/users         → User management (ADMIN only)    │
│   └── /admin/settings      → System settings                  │
│                                                               │
└── 👤 Profile                                                 │
    ├── /profile             → View/edit profile               │
    ├── /profile/password    → Change password form             │
    └── /profile/preferences → Notification preferences         │
```

### 2.2 Navigation Flow Diagram

```
[Login Page]
    │
    ▼
[Dashboard Page] ───────────────────────────────────────────────┐
    │                                                            │
    ├── [Properties List] ──→ [Property Detail] ──→ [Unit Detail]│
    │         │                    │                             │
    │         ▼                    ▼                             │
    │    [Create Property]    [Edit Property]                    │
    │                          [Edit Unit]                       │
    │                                                            │
    ├── [Tenants List] ────→ [Tenant Detail]                     │
    │         │                    │                             │
    │         ▼                    ▼                             │
    │    [Create Tenant]      [Edit Tenant]                      │
    │                          [Documents Upload]                │
    │                                                            │
    ├── [Leases List] ─────→ [Lease Detail]                      │
    │         │                    │                             │
    │         ▼              ┌────┼────┬────┬────┐              │
    │    [Create Lease]      │    │    │    │    │              │
    │    (Wizard: Step 1     ▼    ▼    ▼    ▼    ▼              │
    │     → Select Unit)   Edit  Term  Renew  Sched  Doc        │
    │     → Step 2 Select                                        │
    │       Tenant)                                              │
    │     → Step 3 Terms)                                        │
    │                                                            │
    ├── [Invoices List] ──→ [Invoice Detail]                     │
    │         │                    │                             │
    │         ▼                    ▼                             │
    │    [Record Payment]     [View Receipt]                     │
    │                          [Aging Report]                    │
    │                                                            │
    └── [Tickets List] ────→ [Ticket Detail]                     │
              │                    │                             │
              ▼                    ▼                             │
         [Create Ticket]    [Add Comment]                        │
                            [Update Status]                      │
                            [Assign Vendor]                      │
                            [Resolve]                            │
```

### 2.3 Breadcrumb Patterns

All pages below the top level show breadcrumbs:

```
Dashboard > Properties > Oakwood Apartments

Dashboard > Leases > LS-2026-00055 > Renew

Properties > Oakwood Apartments > Units > Unit 102
```

---

## 3. Login & Registration Flow

### 3.1 Login Page (`/login`)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                   ┌─────────────────────────┐                    │
│                   │  🏠 SmartLease            │                    │
│                   │  Rental Property Mgmt     │                    │
│                   │                           │                    │
│                   │  ┌─────────────────────┐  │                    │
│                   │  │ 📧 Email             │  │                    │
│                   │  │ [________________]   │  │                    │
│                   │  │                      │  │                    │
│                   │  │ 🔒 Password          │  │                    │
│                   │  │ [________________]   │  │                    │
│                   │  │                      │  │                    │
│                   │  │ ┌──────────────────┐ │  │                    │
│                   │  │ │   Sign In         │ │  │                    │
│                   │  │ └──────────────────┘ │  │                    │
│                   │  │                      │  │                    │
│                   │  │ Forgot password?     │  │                    │
│                   │  │ Don't have an        │  │                    │
│                   │  │ account? Register    │  │                    │
│                   │  └─────────────────────┘  │                    │
│                   └─────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**States & Behaviors:**

| State | Behavior |
|---|---|
| **Default** | Empty form, cursor in email field |
| **Typing** | Real-time email format validation via tooltip |
| **Validation Error** | Red border on invalid field, error message below field |
| **Invalid Credentials** | Inline error: "Invalid email or password" — NOT revealing which is wrong |
| **Account Locked** | Warning banner: "Account locked. Try again in X minutes." |
| **Loading** | Button shows spinner, fields disabled |
| **Success** | Redirect to dashboard |
| **Form Field** | `tabindex`: email → password → sign in |

### 3.2 Registration Page (`/register`)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                   ┌─────────────────────────┐                    │
│                   │  Create Your Account     │                    │
│                   │                           │                    │
│                   │  ┌─────────────────────┐  │                    │
│                   │  │ Personal Information │  │                    │
│                   │  │ ─────────────────── │  │                    │
│                   │  │ First Name    [John] │  │                    │
│                   │  │ Last Name      [Doe] │  │                    │
│                   │  │ Email  [j@example]  │  │                    │
│                   │  │ Phone [+1-512...]   │  │                    │
│                   │  │                      │  │                    │
│                   │  │ Security              │  │                    │
│                   │  │ ─────────────────── │  │                    │
│                   │  │ Password   [●●●●●●] │  │ ◄── Strength bar  │
│                   │  │ Confirm     [●●●●●●] │  │     below         │
│                   │  │                      │  │                    │
│                   │  │ Role                  │  │                    │
│                   │  │ ─────────────────── │  │                    │
│                   │  │ (●) Property Manager │  │                    │
│                   │  │ ( ) Tenant           │  │                    │
│                   │  │ ( ) Vendor           │  │                    │
│                   │  │                      │  │                    │
│                   │  │ ☐ I agree to Terms   │  │                    │
│                   │  │                      │  │                    │
│                   │  │ ┌──────────────────┐ │  │                    │
│                   │  │ │  Create Account   │ │  │                    │
│                   │  │ └──────────────────┘ │  │                    │
│                   │  │ Already registered?   │  │                    │
│                   │  │ Sign In               │  │                    │
│                   │  └─────────────────────┘  │                    │
│                   └─────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Password Strength Indicator:**

```
[●●●●●●●●●●●●]  Strong
 ^^^^^^^^^^^^^^^^
    ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
    │  │  │  │  │  │  │  │  │  │  │  │  │
    └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
    0  2  4  6  8  10 12 14 16 18 20 22 24
         Weak    Fair   Strong  Very Strong
```

### 3.3 Forgot Password (`/forgot-password`)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                   ┌─────────────────────────┐                    │
│                   │  Reset Your Password     │                    │
│                   │                           │                    │
│                   │  Enter your email address │                    │
│                   │  and we'll send you a     │                    │
│                   │  reset link.              │                    │
│                   │                           │                    │
│                   │  📧 [________________]   │                    │
│                   │                           │                    │
│                   │  ┌──────────────────┐    │                    │
│                   │  │  Send Reset Link  │    │                    │
│                   │  └──────────────────┘    │                    │
│                   │                           │                    │
│                   │  ← Back to Sign In        │                    │
│                   └─────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**On Submit:** Shows a success toast: "If an account exists with this email, a reset link has been sent."

### 3.4 Reset Password (`/reset-password?token=...`)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                   ┌─────────────────────────┐                    │
│                   │  Set New Password        │                    │
│                   │                           │                    │
│                   │  🔒 New Password         │                    │
│                   │  [________________]      │                    │
│                   │  🔒 Confirm Password     │                    │
│                   │  [________________]      │                    │
│                   │                           │                    │
│                   │  ┌──────────────────┐    │                    │
│                   │  │  Reset Password   │    │                    │
│                   │  └──────────────────┘    │                    │
│                   └─────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Dashboard Pages

### 4.1 Portfolio Dashboard (`/dashboard`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                               [Last updated: 2m ago] │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐       │
│  │ Occupancy │ │Collection│ │   Rent   │ │    Open      │       │
│  │   82%    │ │   Rate   │ │Delinquent│ │  Tickets     │       │
│  │ 410/500  │ │  89.0%   │ │ $52.5K   │ │     35      │       │
│  │ ▲ +2.5%  │ │  $425K   │ │  ▲ 11%   │ │  3 Urgent    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘       │
│                                                                  │
│  ┌──────────────────────────────────────┐ ┌──────────────────┐  │
│  │  Revenue Trend (12 months)            │ │   Alerts          │  │
│  │  ┌────────────────────────────────┐   │ │                   │  │
│  │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │ │ ⚠ SLA Breach:    │  │
│  │  │ ░░▄▆██▆▄░░▄▆██▆▄░░░░░░░░░░░ │   │ │   Ticket #301     │  │
│  │  │ ░░███▄▄░░░████▄░░░░░░░░░░░░  │   │ │ ⚠ Overdue Inv:   │  │
│  │  │ ░████████████████░░░░░░░░░░░  │   │ │   $1,800 (53d)   │  │
│  │  │ ░████████████████░░░░░░░░░░░  │   │ │ ℹ Leases         │  │
│  │  │ ░███████████████████░░░░░░░░  │   │ │   expiring: 5    │  │
│  │  └────────────────────────────────┘   │ └──────────────────┘  │
│  └──────────────────────────────────────┘                        │
│                                                                  │
│  ┌──────────────────────────────────────┐ ┌──────────────────┐  │
│  │  Occupancy by Property                │ │  Lease Expiry     │  │
│  │  ┌────────────────────────────────┐   │ │  Timeline         │  │
│  │  │ Oakwood      ████████████ 85%  │   │ │                   │  │
│  │  │ Maple Gdns   ██████████  78%  │   │ │ ┌───────────────┐ │  │
│  │  │ Pine Court   ███████████ 82%  │   │ │ │ ● ○ ○ ○ ○ ○  │ │  │
│  │  │ Lake View    ████████████ 90% │   │ │ │ Jan─ Feb─ Mar │ │  │
│  │  └────────────────────────────────┘   │ │ └───────────────┘ │  │
│  └──────────────────────────────────────┘ └──────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Tickets by Priority & Category                           │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ LOW ████ 8   MEDIUM █████████ 15  HIGH █████ 9      │  │   │
│  │  │ URGENT ██ 3                                          │  │   │
│  │  │ Plumbing ██████ 10  Electrical ████ 7  HVAC ███ 5   │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Property Dashboard (`/dashboard/property/1`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard > Oakwood Apartments                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐       │
│  │ Occupancy │ │Collection│ │   Open   │ │  Avg Resol   │       │
│  │   75%    │ │   Rate   │ │ Tickets  │ │   16.2 hrs   │       │
│  │ 15/20    │ │  88.0%   │ │    8     │ │  2 SLA Brch  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Overdue Invoices (2)                                     │   │
│  │  ┌────┬──────────┬────────┬────────┬────────┬─────────┐  │   │
│  │  │Inv │ Tenant   │ Unit   │ Due    │ Balance│ Days    │  │   │
│  │  ├────┼──────────┼────────┼────────┼────────┼─────────┤  │   │
│  │  │1005│ Bob T.   │ 205    │07/05   │$1,500 │ 23      │  │   │
│  │  │1006│ Alice W. │ 304    │07/05   │$2,200 │ 23      │  │   │
│  │  └────┴──────────┴────────┴────────┴────────┴─────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────┐ ┌──────────────────────────────┐   │
│  │  Lease Expiry            │ │  Quick Actions                │   │
│  │  30d: 0  60d: 1  90d: 3 │ │  [+ Add Tenant] [+ Add Unit] │   │
│  └─────────────────────────┘ │  [Create Lease] [Record Paym] │   │
│                              └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Tenant Dashboard (`/dashboard/me`)

```
┌─────────────────────────────────────────────────────────────────┐
│  My Dashboard                                                    │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Welcome back, Jane!                                       │   │
│  │  Lease: LS-2026-00055  │  Unit: 102  │ Oakwood Apts       │   │
│  │  Lease expires in 156 days                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────┐ ┌──────────────────────────────────┐  │
│  │  Current Invoice      │ │  Open Tickets                    │  │
│  │  ┌──────────────────┐ │ │  ┌────────────────────────────┐ │  │
│  │  │ August 2026      │ │ │  │🔧 Water leak - URGENT     │ │  │
│  │  │ Due: Aug 5, 2026 │ │ │  │  Status: Assigned          │ │  │
│  │  │ Amount: $2,200   │ │ │  │  Opened: July 28, 2026    │ │  │
│  │  │ Status: Pending  │ │ │  └────────────────────────────┘ │  │
│  │  │ [Pay Now]        │ │ │  [View All Tickets →]          │  │
│  │  └──────────────────┘ │ └──────────────────────────────────┘  │
│  └──────────────────────┘                                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Payment History                                           │   │
│  │  ┌──────┬──────────┬──────────┬──────────┬────────────┐  │   │
│  │  │ Inv  │ Period   │ Amount   │ Method   │ Status     │  │   │
│  │  ├──────┼──────────┼──────────┼──────────┼────────────┤  │   │
│  │  │ Jul  │ July 2026│ $2,200   │ Bank Tr. │ ✅ Paid    │  │   │
│  │  │ Jun  │ June 2026│ $2,200   │ Bank Tr. │ ✅ Paid    │  │   │
│  │  └──────┴──────────┴──────────┴──────────┴────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Property Management Pages

### 5.1 Property List (`/properties`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Properties                          [+ Add Property]           │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  [🔍 Search by name or city...]  [Type: All ▼] [Status ▼]│   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────┬────────────────┬────────┬────────┬────────┬────────────┐│
│  │    │ Property       │ Type   │ City   │Status │  Manager   ││
│  ├────┼────────────────┼────────┼────────┼────────┼────────────┤│
│  │ 🏢 │ Oakwood Apts   │ Res.   │ Austin │Active │  John Doe  ││
│  │    │ 20 units, 3 avl│        │  TX    │       │            ││
│  ├────┼────────────────┼────────┼────────┼────────┼────────────┤│
│  │ 🏢 │ Maple Gardens  │ Res.   │ Austin │Active │  John Doe  ││
│  │    │ 30 units, 7 avl│        │  TX    │       │            ││
│  ├────┼────────────────┼────────┼────────┼────────┼────────────┤│
│  │ 🏢 │ Pine Court     │ Comm.  │ Dallas │Active │  Sarah M.  ││
│  │    │ 10 units, 2 avl│        │  TX    │       │            ││
│  └────┴────────────────┴────────┴────────┴────────┴────────────┘│
│                                                                  │
│  Showing 1-3 of 15    < 1 2 3 4 5 >                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Interactions:**
- Click row → navigate to property detail
- Search bar with debounce (300ms)
- Checkbox for bulk actions (visible to ADMIN/MGR)
- Row hover: subtle background highlight

### 5.2 Property Detail (`/properties/1`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Properties > Oakwood Apartments            [Edit] [Delete]     │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🏢 Oakwood Apartments          RESIDENTIAL  ● Active     │   │
│  │  123 Main St, Austin, TX 78701                            │   │
│  │  Manager: John Doe                                        │   │
│  │  Attributes: Pool ✓  Gym ✓  Pet policy: Cats & dogs      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Units] [Leases] [Invoices] [Tickets] [Images] ← Tab Nav      │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌─── Units Tab (Default) ─────────────────────────────────┐    │
│  │  [+ Add Unit]                     [Status: All ▼]        │    │
│  │  ┌──────┬──────┬────┬────┬──────┬────────┬──────────┐    │    │
│  │  │ Unit │ Bed  │ Bath│ SqFt│ Rent  │ Status  │ Tenant  │    │    │
│  │  ├──────┼──────┼────┼────┼──────┼────────┼──────────┤    │    │
│  │  │ 101  │ 2    │ 1  │ 850│$1,500│Available│ —        │    │    │
│  │  │ 102  │ 3    │ 2  │1200│$2,200│Rented   │ Jane S.  │    │    │
│  │  │ 103  │ 1    │ 1  │ 650│$1,200│Maint.   │ —        │    │    │
│  │  └──────┴──────┴────┴────┴──────┴────────┴──────────┘    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Property Form (`/properties/create` or `/properties/1/edit`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Properties > Create Property                    [Save] [Cancel]│
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌─────────────────────────────────┐  ┌──────────────────────┐  │
│  │  Basic Information               │  │  Location             │  │
│  │  ───────────────────────         │  │  ──────────────       │  │
│  │  Property Name *   [________]    │  │  Address Line 1 *    │  │
│  │  Type *        [Residential ▼]   │  │  [123 Main St________│  │
│  │  Description   [________________]│  │  Address Line 2      │  │
│  │                 [________________]│  │  [___________]       │  │
│  │  Manager *     [John Doe ▼]      │  │  City *     [Austin] │  │
│  │                                  │  │  State *    [TX   ▼] │  │
│  │  Attributes                      │  │  ZIP Code * [78701]  │  │
│  │  ───────────────────────         │  │  Country    [US    ▼] │  │
│  │  Pool:           [Yes ▼]         │  │                      │  │
│  │  Gym:            [No  ▼]         │  │  Coordinates          │  │
│  │  Pet Policy:     [___________]   │  │  ──────────────       │  │
│  │  Parking:        [Garage ▼]      │  │  Latitude  [30.2672] │  │
│  │  Year Built:     [________]      │  │  Longitude [-97.743] │  │
│  └─────────────────────────────────┘  └──────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Form Behavior:**
- All required fields marked with `*`
- Inline validation on blur
- Save button disabled until form is valid
- Unsaved changes warning when navigating away
- Country defaults to "US"

---

## 6. Tenant Management Pages

### 6.1 Tenant List (`/tenants`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Tenants                               [+ Add Tenant]           │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  [🔍 Search by name, email, or phone...]  [Status: All ▼]       │
│                                                                  │
│  ┌────┬──────────┬──────────┬─────────────┬────────┬──────────┐ │
│  │    │ Name     │ Email    │ Phone       │ Status │ Lease    │ │
│  ├────┼──────────┼──────────┼─────────────┼────────┼──────────┤ │
│  │ 👤 │ Jane S.  │ j@e.com  │ +1-512-...  │ Active │ LS-00055 │ │
│  │    │ Oakwood, Unit 102   │             │        │          │ │
│  ├────┼──────────┼──────────┼─────────────┼────────┼──────────┤ │
│  │ 👤 │ Bob T.   │ b@e.com  │ +1-512-...  │ Active │ LS-00056 │ │
│  │    │ Oakwood, Unit 205   │             │        │          │ │
│  └────┴──────────┴──────────┴─────────────┴────────┴──────────┘ │
│                                                                  │
│  Showing 1-2 of 85    < 1 2 3 4 5 >                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Tenant Detail (`/tenants/201`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Tenants > Jane Smith                          [Edit] [Delete]  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌───────────────┐ ┌────────────────────────────────────────┐   │
│  │ 👤 Jane Smith  │ │  Lease History                         │   │
│  │  j@email.com   │ │  ┌────┬────────┬───────┬───────┬───┐  │   │
│  │  +1-512-555-01 │ │  │ #  │ Prop.  │ Unit  │ Period│St │  │   │
│  │  Status: Active│ │  ├────┼────────┼───────┼───────┼───┤  │   │
│  │                │ │  │ 55 │Oakwood │ 102   │2026   │A  │  │   │
│  │  Emergency:    │ │  │    │        │       │Jan-Dec│   │  │   │
│  │  Bob Smith     │ │  ├────┼────────┼───────┼───────┼───┤  │   │
│  │  +1-512-555-199│ │  │ 42 │Oakwood │ 102   │2025   │Ex │  │   │
│  │                │ │  │    │        │       │Jan-Dec│   │  │   │
│  │  Employer:     │ │  └────┴────────┴───────┴───────┴───┘  │   │
│  │  Tech Corp     │ └────────────────────────────────────────┘   │
│  │  Income:$85K   │                                              │
│  └───────────────┘                                              │
│                                                                  │
│  [Documents] [Contacts] [Notes] ← Tab Nav                       │
│  ┌─── Documents Tab ────────────────────────────────────────┐   │
│  │  [Upload Document]                                        │   │
│  │  ┌──────────────┬──────────────┬─────────┬────────────┐  │   │
│  │  │ Type         │ Filename     │ Size    │ Uploaded   │  │   │
│  │  ├──────────────┼──────────────┼─────────┼────────────┤  │   │
│  │  │ ID Proof     │ jane_id.pdf │ 245 KB │ Jan 1,2026 │  │   │
│  │  │ Lease Agrmt  │ lease_55.pdf│ 512 KB │ Jan 1,2026 │  │   │
│  │  └──────────────┴──────────────┴─────────┴────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Tenant Form (`/tenants/create` or `/tenants/201/edit`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Tenants > Create Tenant                       [Save] [Cancel]  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌──────────────────────────┐ ┌──────────────────────────────┐  │
│  │  Personal Information     │ │  Employment & Income          │  │
│  │  ────────────────────     │ │  ──────────────────────────   │  │
│  │  First Name * [Jane___]   │ │  Employer    [Tech Corp____] │  │
│  │  Last Name *  [Smith__]   │ │  Annual Income [$85,000____] │  │
│  │  Email *   [j@email.com]  │ │                              │  │
│  │  Phone    [+1-512-555-01] │ │  Preferences                  │  │
│  │                           │ │  ──────────────────────────   │  │
│  │  Emergency Contact        │ │  Contact Method [Email ▼]    │  │
│  │  ────────────────────     │ │  Language      [English ▼]   │  │
│  │  Name  [Bob Smith_____]   │ │                              │  │
│  │  Phone [+1-512-555-199]   │ │  Notes                        │  │
│  │                           │ │  ──────────────────────────   │  │
│  │  Date of Birth [1990-05-15]││  [_________________________] │  │
│  └──────────────────────────┘ └──────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Lease Management Pages

### 7.1 Lease List (`/leases`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Leases                                 [+ Create Lease]        │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  [Status: All ▼] [Property: All ▼] [🔍 Search...]               │
│                                                                  │
│  ┌───────┬────────┬────────┬────────┬────────┬────────┬───────┐ │
│  │ Lease │ Tenant │ Unit   │ Period │ Rent   │ Status │ Exp.  │ │
│  ├───────┼────────┼────────┼────────┼────────┼────────┼───────┤ │
│  │ LS-55 │ Jane S.│ 102    │Jan-Dec │$2,200  │ ● Active│ 156d │ │
│  │       │        │Oakwood │ 2026   │        │         │       │ │
│  ├───────┼────────┼────────┼────────┼────────┼────────┼───────┤ │
│  │ LS-56 │ Bob T. │ 205    │Mar-Feb │$1,800  │ ● Active│ 210d │ │
│  │       │        │Oakwood │2026-27 │        │         │       │ │
│  ├───────┼────────┼────────┼────────┼────────┼────────┼───────┤ │
│  │ LS-42 │ Jane S.│ 102    │Jan-Dec │$2,100  │ ○ Expired│ —   │ │
│  │       │        │Oakwood │ 2025   │        │         │       │ │
│  └───────┴────────┴────────┴────────┴────────┴────────┴───────┘ │
│                                                                  │
│  Showing 1-3 of 42    < 1 2 3 4 5 >                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Lease Detail (`/leases/55`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Leases > LS-2026-00055                    [Edit][Terminate][Rene]│
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Lease LS-2026-00055                         ● ACTIVE     │   │
│  │  Oakwood Apartments, Unit 102                              │   │
│  │  Tenant: Jane Smith                                        │   │
│  │  Period: Jan 1, 2026 → Dec 31, 2026 (156 days remaining)  │   │
│  │  Base Rent: $2,200/mo  │  Deposit: $2,200                  │   │
│  │  Rent Due: 1st of month │  Frequency: Monthly               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Rent Schedule] [Deposit Ledger] [Invoices] [Documents]        │
│  ┌─── Rent Schedule Tab ───────────────────────────────────┐    │
│  │  [Add Schedule]                                          │    │
│  │  ┌────┬──────────┬────────┬───────────┬────────┬──────┐  │    │
│  │  │ #  │ Effective│ Rent   │ Escalation│ Active │      │  │    │
│  │  ├────┼──────────┼────────┼───────────┼────────┼──────┤  │    │
│  │  │ 1  │Jan 2026  │$2,200  │ —         │ ✅     │[Edit]│  │    │
│  │  └────┴──────────┴────────┴───────────┴────────┴──────┘  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Create Lease — Wizard (`/leases/create`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Leases > Create Lease                                          │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  Step 1 of 3: Select Unit            [Next →]    [Cancel]       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Property: [Oakwood Apartments ▼]                        │   │
│  │                                                           │   │
│  │  Available Units (3):                                     │   │
│  │  ┌────┬──────┬────┬──────┬──────┬────────┐               │   │
│  │  │ ○  │ 101  │ 2BR│ 850sf│$1,500│ Pool View│             │   │
│  │  │ ●  │ 201  │ 1BR│ 650sf│$1,200│ Garden  │             │   │
│  │  │ ○  │ 301  │ 3BR│1200sf│$2,400│ Corner  │             │   │
│  │  └────┴──────┴────┴──────┴──────┴────────┘               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ──────────────────────── Step Progress ────────────────────    │
│  ● Step 1: Unit    ○ Step 2: Tenant    ○ Step 3: Terms          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 2 of 3: Select Tenant         [← Back] [Next →] [Cancel] │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Search: [🔍 Search by name or email...]                  │   │
│  │                                                           │   │
│  │  Eligible Tenants (no active lease):                      │   │
│  │  ┌────┬──────────┬──────────┬─────────┬──────────────┐   │   │
│  │  │ ○  │ Alice W. │ a@e.com  │$65,000  │ No active    │   │   │
│  │  │ ●  │ Bob T.   │ b@e.com  │$72,000  │ Ends Feb 2027│   │   │
│  │  └────┴──────────┴──────────┴─────────┴──────────────┘   │   │
│  │                                                           │   │
│  │  Co-tenants (optional):                                   │   │
│  │  [Search and add co-tenants...]                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ○ Step 1    ● Step 2    ○ Step 3                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 3 of 3: Lease Terms         [← Back] [Create] [Cancel]   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Unit: 101 — Oakwood Apartments                          │   │
│  │  Tenant: Alice W.                                        │   │
│  │                                                           │   │
│  │  ┌──────────────────────┐ ┌──────────────────────────┐   │   │
│  │  │ Start Date * [01/15/27]│ │  End Date * [01/14/28]  │   │   │
│  │  │ Base Rent *  [$1,500] │ │  Deposit *   [$1,500]   │   │   │
│  │  │ Due Day *    [1st ▼]  │ │  Frequency   [Monthly]  │   │   │
│  │  └──────────────────────┘ └──────────────────────────┘   │   │
│  │                                                           │   │
│  │  Escalation (optional):                                   │   │
│  │  Percentage [3.0%]  Frequency [12 months ▼]              │   │
│  │                                                           │   │
│  │  Terms & Conditions:                                      │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Standard lease terms apply...                       │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                                                           │   │
│  │  Notes:                                                   │   │
│  │  [__________________________________________________]    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ○ Step 1    ○ Step 2    ● Step 3                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Rent Collection Pages

### 8.1 Invoice List (`/invoices`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Invoices                                 [Generate Invoices]   │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  [Status: All ▼] [Property: All ▼] [Due: Any ▼] [🔍 Search]    │
│                                                                  │
│  ┌──────┬──────────┬──────┬────────┬──────────┬────────┬──────┐ │
│  │ Inv# │ Tenant   │ Unit │ Period │ Amount   │ Status │ Due │ │
│  ├──────┼──────────┼──────┼────────┼──────────┼────────┼──────┤ │
│  │ 1001 │ Jane S.  │ 102  │ Aug    │ $2,200   │PENDING │Aug5 │ │
│  │      │          │      │ 2026   │          │        │     │ │
│  │ 1002 │ Bob T.   │ 205  │ Aug    │ $1,800   │PENDING │Aug5 │ │
│  │      │          │      │ 2026   │          │        │     │ │
│  │ 1005 │ Bob T.   │ 205  │ Jul    │ $1,800+75│OVERDUE │Jul5 │ │
│  │      │          │      │ 2026   │ (late fee)│        │ 23d │ │
│  └──────┴──────────┴──────┴────────┴──────────┴────────┴──────┘ │
│                                                                  │
│  Showing 1-3 of 200    < 1 2 3 ... 67 >                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Color Coding by Status:**
- `PENDING` → Blue
- `PARTIALLY_PAID` → Orange
- `PAID` → Green
- `OVERDUE` → Red (with days badge)
- `CANCELLED` → Gray

### 8.2 Invoice Detail (`/invoices/1001`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Invoices > INV-2026-08-00001                   [Record Payment]│
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Invoice INV-2026-08-00001                   ● PENDING    │   │
│  │  Lease: LS-2026-00055                                    │   │
│  │  Oakwood Apartments, Unit 102 — Jane Smith                │   │
│  │  Period: August 1, 2026 → August 31, 2026                 │   │
│  │  Due: August 5, 2026                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌───────────────────────────────────┐                          │
│  │  Amount Breakdown                  │                          │
│  │  ─────────────────────             │                          │
│  │  Base Rent                $2,200.00│                          │
│  │  Late Fee                   $0.00  │                          │
│  │  Discount                   $0.00  │                          │
│  │  Adjustment                 $0.00  │                          │
│  │  ─────────────────────             │                          │
│  │  Total Due                $2,200.00│                          │
│  │  Paid                      $0.00   │                          │
│  │  ─────────────────────             │                          │
│  │  Balance Due              $2,200.00│                          │
│  └───────────────────────────────────┘                          │
│                                                                  │
│  ┌─── Payment History ──────────────────────────────────────┐   │
│  │  No payments recorded yet                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Record Payment (`/payments/create`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Record Payment                              [Save] [Cancel]    │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Invoice: INV-2026-08-00001     Balance: $2,200.00        │   │
│  │  Tenant: Jane Smith  |  Oakwood Apts  |  Unit 102         │   │
│  │                                                           │   │
│  │  Amount *       [$2,200.00]                               │   │
│  │  Payment Date * [08/03/2026]                              │   │
│  │  Method *       [Bank Transfer ▼]                         │   │
│  │  Reference #    [WTX-20260803-98765]                      │   │
│  │  Notes          [Online payment via portal]               │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ 💡 The invoice will be marked as PAID if the amount │  │   │
│  │  │ matches the balance. Partial payments are also      │  │   │
│  │  │ supported.                                          │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 Aging Report (`/reports/aging`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Reports > Aging Report                    [Export CSV] [Print] │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  Property: [Oakwood Apartments ▼]  As of: [07/28/2026]          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Summary: Total Outstanding: $12,500  (18 invoices)       │   │
│  │                                                           │   │
│  │  ┌──────────────┬──────────────┬──────────┬───────────┐  │   │
│  │  │ Bucket       │ Amount       │ Invoices │ % of Total│  │   │
│  │  ├──────────────┼──────────────┼──────────┼───────────┤  │   │
│  │  │ Current      │ $8,500       │ 12       │ 68.0%     │  │   │
│  │  │ 1-30 Days    │ $2,200       │ 3        │ 17.6%     │  │   │
│  │  │ 31-60 Days   │ $1,000       │ 2        │ 8.0%      │  │   │
│  │  │ 61-90 Days   │ $800         │ 1        │ 6.4%      │  │   │
│  │  │ 90+ Days     │ $0           │ 0        │ 0.0%      │  │   │
│  │  └──────────────┴──────────────┴──────────┴───────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─── Detail ───────────────────────────────────────────────┐   │
│  │  ┌──────┬──────────┬──────┬────────┬────────┬────────┐   │   │
│  │  │ Inv# │ Tenant   │ Unit │ Due    │ Amount │ Days   │   │   │
│  │  ├──────┼──────────┼──────┼────────┼────────┼────────┤   │   │
│  │  │ 1005 │ Bob T.   │ 205  │Jul 5   │$1,800  │ 23     │   │   │
│  │  │ 1003 │ Alice W. │ 304  │Jun 5   │$1,000  │ 53     │   │   │
│  │  └──────┴──────────┴──────┴────────┴────────┴────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.5 Receipt View (`/receipts/9001`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Receipt #RCT-2026-08-00001                 [Print] [Download]  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    PAYMENT RECEIPT                         │   │
│  │                    ──────────────                          │   │
│  │                                                           │   │
│  │  SmartLease Rental Management                              │   │
│  │  123 Business Ave, Suite 400                               │   │
│  │  Austin, TX 78701                                          │   │
│  │                                                           │   │
│  │  ─────────────────────────────────────────────────          │   │
│  │                                                           │   │
│  │  Receipt #:     RCT-2026-08-00001                         │   │
│  │  Date:          August 3, 2026                            │   │
│  │  Tenant:        Jane Smith                                │   │
│  │  Property:      Oakwood Apartments, Unit 102              │   │
│  │                                                           │   │
│  │  ─────────────────────────────────────────────────          │   │
│  │                                                           │   │
│  │  Description                         Amount               │   │
│  │  ───────────────────────────────────────────              │   │
│  │  Rent — August 2026                   $2,200.00           │   │
│  │  Payment Method: Bank Transfer                            │   │
│  │  Reference: WTX-20260803-98765                             │   │
│  │                                                           │   │
│  │  ─────────────────────────────────────────────────          │   │
│  │                                                           │   │
│  │  Total Paid:                           $2,200.00           │   │
│  │  Balance Due:                           $0.00              │   │
│  │                                                           │   │
│  │  ─────────────────────────────────────────────────          │   │
│  │                                                           │   │
│  │  Thank you for your payment!                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Maintenance Tickets Pages

### 9.1 Ticket List (`/tickets`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Maintenance Tickets                     [+ Create Ticket]      │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  [Status: All ▼] [Priority: All ▼] [Property: All ▼] [🔍 Search]│
│                                                                  │
│  ┌──────┬──────────────┬────────┬─────────┬────────┬──────────┐ │
│  │ ID   │ Title        │ Unit   │ Priority│ Status │ Age      │ │
│  ├──────┼──────────────┼────────┼─────────┼────────┼──────────┤ │
│  │ 301  │ Water leak   │ 102    │ 🔴 Urgt │Assigned│ 2.5h    │ │
│  │ 302  │ AC not cool  │ 205    │ 🟡 High │Open    │ 5h      │ │
│  │ 303  │ Light flicker│ 101    │ 🟢 Low  │In Prog │ 2d      │ │
│  │ 304  │ Pest control │ 304    │ 🔵 Med  │Open    │ 1d      │ │
│  └──────┴──────────────┴────────┴─────────┴────────┴──────────┘ │
│                                                                  │
│  Showing 1-4 of 35    < 1 2 3 4 5 >                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Priority Indicators:**
- 🔴 URGENT — Red badge, bold, shown first
- 🟡 HIGH — Orange badge
- 🔵 MEDIUM — Blue badge
- 🟢 LOW — Gray badge

**SLA Breach Indicator:**
- ⏰ Warning icon next to breached tickets
- Red row border for breached URGENT tickets

### 9.2 Ticket Detail (`/tickets/301`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Tickets > TK-2026-00301                 [Edit] [Assign] [Resolv]│
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  TK-2026-00301              🔴 URGENT    ● ASSIGNED      │   │
│  │  Water leak in kitchen sink                               │   │
│  │                                                           │   │
│  │  Oakwood Apartments, Unit 102                              │   │
│  │  Reported by: Jane Smith (Tenant)  |  Jul 28, 2026 8:00 AM│   │
│  │  Assigned to: Mike Plumber        |  Jul 28, 2026 9:00 AM│   │
│  │                                                           │   │
│  │  ⏰ SLA Deadline: Jul 28, 2026 12:00 PM (2h remaining)    │   │
│  │  🟢 SLA Status: On Track                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─── Comments ─────────────────────────────────────────────┐   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ Mike Plumber (Vendor)    10:00 AM                    │  │   │
│  │  │ ───────────────────────────────────────              │  │   │
│  │  │ Arrived on site. Replacing the pipe. Will be done   │  │   │
│  │  │ in 2 hours.                                         │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ Jane Smith (Tenant)     8:30 AM                     │  │   │
│  │  │ ───────────────────────────────────────              │  │   │
│  │  │ The leak is getting worse! Please send someone ASAP.│  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ Add a comment...                     [📎] [Send]    │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─── Attachments ──────────────────────────────────────────┐   │
│  │  📎 leak_photo.jpg  (1 MB)  Uploaded Jul 28, 2026        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Create Ticket (`/tickets/create`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Create Maintenance Ticket                   [Submit] [Cancel]  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Property *  [Oakwood Apartments ▼]                       │   │
│  │  Unit *      [▼]  (filtered by property selection)        │   │
│  │  Title *     [___________________________________]        │   │
│  │  Category *  [Plumbing ▼]                                 │   │
│  │  Priority *  [Urgent ▼]                                   │   │
│  │                                                           │   │
│  │  Description *                                             │   │
│  │  ┌──────────────────────────────────────────────────────┐ │   │
│  │  │ Water is leaking from under the kitchen sink.       │ │   │
│  │  │ There is standing water in the cabinet.              │ │   │
│  │  └──────────────────────────────────────────────────────┘ │   │
│  │                                                           │   │
│  │  Attachments (optional, max 5 files, 10 MB each):          │   │
│  │  [📎 Choose Files...]  No files selected                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.4 Vendor Directory (`/vendors`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Vendors                                 [+ Add Vendor]         │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  [Specialty: All ▼]  [Status: Active ▼]                         │
│                                                                  │
│  ┌────┬──────────────┬──────────┬──────────┬──────┬──────────┐ │
│  │    │ Name         │ Specialty│ Contact  │ Rate │ Jobs     │ │
│  ├────┼──────────────┼──────────┼──────────┼──────┼──────────┤ │
│  │ 🔧 │ ABC Plumbing│ Plumbing │ Mike J.  │ $85/h│ 47       │ │
│  │ 🔧 │ Spark Elect.│ Electrcl │ Sara L.  │ $90/h│ 32       │ │
│  │ 🔧 │ CoolAir HVAC│ HVAC     │ Tom K.   │ $95/h│ 18       │ │
│  └────┴──────────────┴──────────┴──────────┴──────┴──────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Responsive Layout Breakpoints

### 10.1 Layout Adaptation

```
Desktop (≥992px):                         Tablet (768–991px):
┌─────────────────────┬──────────────┐    ┌──────────────────────┐
│                     │              │    │  ☰ SmartLease  [🔔]  │
│                     │              │    ├──────────────────────┤
│    Sidebar          │   Content    │    │                      │
│    (250px)          │   (Fluid)    │    │   Content            │
│    Always visible   │              │    │   (Full width)       │
│                     │              │    │                      │
│                     │              │    │                      │
└─────────────────────┴──────────────┘    └──────────────────────┘
                                          Sidebar: hidden, toggled
                                          via hamburger ☰ button

Phone (<768px):
┌──────────────────────┐
│  ☰ SmartLease [🔔]   │
├──────────────────────┤
│                      │
│   Content            │
│   (Full width,       │
│    stacked cards)    │
│                      │
│                      │
└──────────────────────┘
┌──────────────────────┐
│  Bottom Nav Bar      │
│ 🏠 📋 👤 💰 🔧       │
└──────────────────────┘
Sidebar: slide-in overlay
Navigation: bottom tab bar on phones
```

### 10.2 Component Adaptation by Screen Size

```
Component              │ Desktop (≥992px) │ Tablet (768-991px) │ Phone (<768px)
───────────────────────┼──────────────────┼────────────────────┼─────────────────────
Data Tables            │ Full table with  │ Full table with    │ Card layout
                       │ all columns      │ horizontal scroll  │ (each row = card)
                       │                  │                    │
Sidebar                │ Fixed, always    │ Hidden, toggled by │ Hidden, slide-in
                       │ visible          │ hamburger icon     │ overlay
                       │                  │                    │
Top Navbar             │ Full branding    │ Condensed branding │ Icon-only branding
                       │                  │                    │
Dashboard Cards        │ 4 columns        │ 2 columns          │ 1 column (stacked)
                       │                  │                    │
Forms                  │ 2 columns        │ 1.5 columns        │ 1 column (stacked)
                       │ (side by side)   │ (some stacking)    │ (all stacked)
                       │                  │                    │
Filters Bar            │ Inline row       │ Wrapped 2 rows     │ Collapsible accordion
                       │                  │                    │
Modals                 │ Centered, 600px  │ Centered, 80%      │ Full screen drawer
                       │                  │                    │
Action Buttons         │ Inline with      │ Inline with        │ Full width, stacked
                       │ header           │ header             │ at bottom
                       │                  │                    │
Pagination             │ Full paginator   │ Condensed (page #) │ "Load More" button
                       │                  │                    │
Charts                 │ Full sized       │ Full sized          │ Smaller, scrollable
                       │                  │                    │
```

### 10.3 Responsive Table → Card Transformation

```
Desktop Table View:
┌────┬──────────┬──────────┬────────┬──────────┬────────┐
│ ID │ Name     │ Email    │ Phone  │ Status   │ Lease  │
├────┼──────────┼──────────┼────────┼──────────┼────────┤
│201 │ Jane S.  │ j@e.com  │512-... │ ● Active │ LS-55  │
│202 │ Bob T.   │ b@e.com  │512-... │ ● Active │ LS-56  │
└────┴──────────┴──────────┴────────┴──────────┴────────┘

Phone Card View:
┌─────────────────────────────────────────┐
│  👤 Jane Smith                           │
│  📧 j@e.com     📞 +1-512-555-0101      │
│  🏠 Oakwood, Unit 102                    │
│  ─────────────────────────────────      │
│  Status: ● Active                        │
│  Lease: LS-2026-00055                    │
│  ┌────┬─────────────────────────┐        │
│  │Edit│  [View Details →]       │        │
│  └────┴─────────────────────────┘        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  👤 Bob Thomas                           │
│  📧 b@e.com     📞 +1-512-555-0102      │
│  🏠 Oakwood, Unit 205                    │
│  ─────────────────────────────────      │
│  Status: ● Active                        │
│  Lease: LS-2026-00056                    │
│  ┌────┬─────────────────────────┐        │
│  │Edit│  [View Details →]       │        │
│  └────┴─────────────────────────┘        │
└─────────────────────────────────────────┘
```

### 10.4 Toast & Notification Positions

```
Desktop:
┌────────────────────────────────────────┐
│                    ┌─────────────────┐ │
│                    │  ✅ Saved!  [✕] │ │
│                    │  Top-right      │ │
│                    └─────────────────┘ │
│                                         │
│                                         │
│  ┌──────────────────────────────┐      │
│  │  ⚠ Lease date overlap       │      │
│  │  Inline error in form       │      │
│  └──────────────────────────────┘      │
│                                         │
└────────────────────────────────────────┘

Phone:
┌────────────────────────────────────────┐
│  ┌────────────────────────────────┐    │
│  │  ✅ Tenant created successfully │    │
│  │  Bottom toast                  │    │
│  └────────────────────────────────┘    │
└────────────────────────────────────────┘
```

### 10.5 Touch Targets (Mobile)

| Element | Minimum Size |
|---|---|
| Buttons | 44×44 px |
| Form inputs | 44 px height |
| Table rows | 48 px height |
| Sidebar menu items | 48 px height |
| Pagination controls | 44×44 px |
| Filter chips | 32×32 px (tap) |
| Bottom nav tabs | 56×56 px |
| Modal close button | 44×44 px |

---

> *This UI flow document is the definitive guide for all SmartLease front-end development.*  
> *For API contracts, see [API_CONTRACT.md](./API_CONTRACT.md).*  
> *For database schema, see [DATABASE.md](./DATABASE.md).*  
> *For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).*  
> *For business requirements, see [REQUIREMENTS.md](./REQUIREMENTS.md).*
