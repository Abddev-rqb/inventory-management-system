# Django Bulk Import Products — Inventory, Orders, Returns & Operations Platform

A production-oriented inventory and operations system built to solve the problems that appear after basic CRUD already works: serialized inventory integrity, bulk operations, role-based access, returns, service workflows, sales reconciliation, safe state transitions, filtering, export consistency, and operational reliability.

This repository is intentionally solution-focused. The goal is not to showcase an attractive demo. The goal is to show how business rules are converted into reliable software behavior.

---

## Problem This System Solves

Laptop inventory is not a simple quantity-based stock problem.

Every physical laptop has its own:

- Serial number
- Hardware configuration
- Purchase price
- Selling price
- Quality status
- Inventory state
- Storage area
- Service history
- Sales history
- Return history

The system therefore treats every laptop as a serialized asset.

```text
1 database row = 1 physical laptop
quantity = 1
serial number = unique device identity
```

The backend enforces this rule so it cannot be bypassed by the frontend.

---

# Engineering Problems Solved

## 1. Serialized Inventory Integrity

Instead of storing one product row with a large quantity, every laptop is tracked individually.

This makes the following reliable:

- Sales traceability
- Return processing
- Service tracking
- Warranty tracking
- Serial-number search
- Historical reporting

---

## 2. Safe Excel Import Workflow

Spreadsheet import is implemented as a validation workflow rather than a blind database insert.

```text
Excel Upload
    ↓
Preview
    ↓
Row Validation
    ↓
Valid / Invalid Classification
    ↓
User Confirmation
    ↓
Atomic Database Write
```

The backend validates:

- Required fields
- Serial-number uniqueness
- Quantity rules
- Choice values
- Pricing
- Inventory status
- Spreadsheet row limits
- Technician/user references for return imports

Invalid rows return actionable errors instead of causing a partially completed import.

---

## 3. Create Import and Bulk Update Are Separate

Creating new inventory and modifying existing inventory are different business operations.

### Create Import

- New laptops only
- Existing serial numbers are rejected
- No silent overwrite

### Bulk Update

- Serial number is the immutable lookup key
- Blank spreadsheet cells preserve existing values
- Protected fields cannot be changed

Protected examples:

- Database ID
- Serial number
- Quantity
- Created timestamp
- Updated timestamp

Unsafe lifecycle states such as sold or service-controlled devices are rejected.

---

## 4. Atomic Bulk Delete

Bulk deletion validates the full selection before deleting anything.

If one selected laptop is protected, the entire operation is rejected.

Protected cases include:

- Sold laptops
- Laptops in service
- Laptops with sales history
- Laptops with service history

This avoids partial destructive operations and preserves audit history.

---

## 5. Controlled Business-State Transitions

Status is treated as business state, not just as a dropdown value.

Example internal service flow:

```text
In Stock
   ↓
To Service
   ↓
In Service
   ↓
Repair Completed
   ↓
Done
   ↓
Original Inventory Status Restored
```

Example customer return flow:

```text
Received
   ↓
In Service
   ↓
Repair Completed
   ↓
Done
   ↓
Pending Order
   ↓
Dispatch
```

State changes trigger controlled side effects instead of arbitrary updates.

---

## 6. Return Fulfilment Without Double-Counting Revenue

A repaired customer return may need to be dispatched again.

A naive implementation can accidentally count this as another sale.

This system distinguishes:

```text
Normal Sales Order
vs
Return Fulfilment Order
```

Return-generated fulfilment orders are linked to their source return and excluded from normal revenue reporting.

---

## 7. Context-Aware Pending Order Cancellation

Pending-order deletion behaves differently depending on the source.

### Normal Sales Order

The laptop is restored to inventory.

### Return-Generated Order

The corresponding return is restored to the correct workflow state instead of incorrectly returning the device to normal stock.

This avoids applying one generic CRUD delete rule to different business cases.

---

## 8. Customer Returns and Internal Service Are Separate

The application handles:

- Customer-return service
- Internal stock service

Internal service remembers the original inventory status.

```text
In Stock G
    ↓
In Service
    ↓
Repair Completed
    ↓
Done
    ↓
In Stock G
```

The original stock category is restored correctly.

---

## 9. Role-Based Access on Frontend and Backend

UI visibility is not treated as security.

Permissions are enforced again in the backend.

Roles include:

- Admin
- Sales
- Technician
- Inventory Viewer

Permission-controlled operations include:

- Bulk update
- Bulk delete
- Return priority assignment
- Technician workflow
- User management
- Sales reporting
- Return editing
- Destructive actions

---

## 10. Shared Business Logic

Critical calculations are centralized to prevent drift.

Example:

```text
ReturnExpense records
      ↓
Shared Expense Service
      ↓
Returns → Expenses
      ↓
Total Sales → Total Expenses
```

Both screens use the same source of truth.

---

## 11. Server-Side Search and Date Filtering

Search is performed on the backend queryset instead of filtering only the currently loaded browser page.

Search supports fields such as:

- Order number
- Customer
- Employee
- Item
- Serial number
- Laptop attributes

Date filters are timezone-aware and include the full selected end date.

This keeps filtering correct across pagination.

---

## 12. Export Matches Active Filters

Exports reuse the active query filters.

This prevents cases where the UI shows filtered records but the downloaded spreadsheet contains unrelated rows.

Examples include:

- Search
- Date range
- Employee filter
- Inventory filters

---

## 13. Historical Sales Data Uses Snapshots

Historical reports should not change because a laptop record changes later.

Order items store historical values such as serial-number snapshots.

This improves:

- Auditability
- Reporting consistency
- Historical accuracy

---

## 14. Expense Tracking Integrated With Sales Reporting

Return/service expenses track:

- Item
- Unit price
- Quantity
- Total amount
- Return reference
- Laptop details
- Created date

Total amount is derived from:

```text
unit price × quantity
```

Sales summary includes:

- Total sales amount
- Total expenses
- Total orders
- Total items sold
- Retail sales
- Wholesale sales

Expense totals follow the reporting date range without being incorrectly reduced by sales employee or sales text filters.

---

## 15. Defensive API Design

Backend operations are designed to fail safely.

Examples:

- Validation before persistence
- Atomic database operations
- Explicit permission checks
- Protected lifecycle transitions
- Duplicate prevention
- Server-side filtering
- Backend enforcement of business rules
- Meaningful API errors

The frontend improves usability, but database correctness does not depend on trusting the frontend.

---

# Architecture

```text
React / Vite
     ↓
REST API
     ↓
Django REST Framework
     ↓
Service Layer
     ↓
Django ORM
     ↓
MySQL
```

Business rules are kept in service-layer code instead of being scattered across UI components and thin CRUD handlers.

Major service responsibilities include:

- Inventory lifecycle
- Import validation
- Import confirmation
- Bulk update
- Bulk delete
- Order dispatch
- Pending-order cancellation
- Sales reporting
- Return workflow
- Return fulfilment
- Return expenses
- Internal stock service

---

# Technology Stack

## Backend

- Python
- Django
- Django REST Framework
- MySQL
- pandas
- NumPy

## Frontend

- React
- JavaScript ES6+
- JSX
- React Hooks
- React Router
- Axios
- Vite

## Engineering

- Git
- GitHub
- REST API design
- Role-based authorization
- Service-layer architecture
- Database transactions
- Validation workflows
- Responsive UI

---

# Engineering Principles Demonstrated

## Database Is the Source of Truth

Sensitive and destructive actions are validated by the backend even if a user bypasses the UI.

## One Business Rule, One Authoritative Implementation

Critical calculations and state transitions are centralized.

## Historical Data Must Remain Historical

Sales history uses snapshots rather than depending entirely on mutable inventory rows.

## Destructive Operations Must Fail Safely

Bulk delete and confirmation workflows validate before writing.

## Status Is a Business State

Inventory, order, service, and return states define allowed transitions and side effects.

## Search Must Work Across the Dataset

Filtering happens server-side so pagination does not produce misleading results.

## Reporting Must Match Operations

Sales, expenses, filters, exports, and historical records are kept consistent with the same underlying rules.

---

# Root-Cause Analysis and Debugging Work

The repository also demonstrates debugging across frontend, API, service, permission, and database layers.

Examples of issues identified and corrected include:

- Frontend/backend permission mismatches
- Missing serializer method implementations
- Missing role imports causing runtime failures
- API/service method-signature mismatches
- Unsupported media type errors
- Import preview/confirmation contract mismatches
- Username-versus-user-ID resolution problems
- Incorrect restoration after cancelling return-generated orders
- Date filters excluding records later in the selected day
- Duplicate expense calculations drifting apart
- Mobile navigation behavior
- Frontend accessibility-role test failures

The goal is not to pretend defects never occur.

The engineering value is being able to isolate the failing layer, identify the violated contract, correct the root cause, and verify the business behavior afterward.

---

# What This Repository Demonstrates About the Engineer

This project demonstrates more than framework knowledge.

It shows the ability to reason about:

- Business workflows
- Data integrity
- API contracts
- Backend authority
- State machines
- Permission boundaries
- Historical consistency
- Bulk-data safety
- Reporting correctness
- Failure handling
- Root-cause analysis
- Cross-layer debugging
- Operational maintainability

The recurring engineering question is:

> What can go wrong when this feature is used with real inventory, real users, and real business data?

The implementation is designed around solving that question rather than simply adding another screen.

---

# Functional Scope

```text
Laptop Inventory
├── Serialized inventory
├── CRUD
├── Pagination
├── Search / filter / ordering
├── Date filtering
├── Excel import preview
├── Import confirmation
├── Filtered export
├── Bulk update
├── Bulk delete
└── Internal To Service workflow

Orders
├── Pending orders
├── Search
├── Date filtering
├── Cancellation
├── Dispatch
└── Return-generated fulfilment

Sales
├── Historical sales
├── Serial-number snapshots
├── Search
├── Date filtering
├── Employee filtering
├── Filtered export
└── Sales + expense summary

Returns
├── Customer returns
├── Internal stock service
├── Technician assignment
├── Priority management
├── Repair workflow
├── Customer address
├── Import / export
├── Return expenses
├── Search
├── Date filtering
├── Stock-in
└── Re-dispatch workflow

Access Control
├── Admin
├── Sales
├── Technician
└── Inventory Viewer
```

---

# Engineering Direction

The next stage is focused on production readiness rather than decorative features.

Planned areas include:

- Automated backend tests
- Frontend integration tests
- CI/CD
- Structured logging
- Monitoring and alerting
- Containerization
- Deployment architecture
- Database backup strategy
- Security hardening
- Performance profiling
- Operational dashboards
- Incident-oriented observability

The objective is to move the repository from application development toward production engineering.
