# Product Requirements Document (PRD)

## User Personas

### Super Admin
- Manages all tenants
- Controls subscriptions
- Views system-wide data

### Tenant Admin
- Manages users, projects, tasks within tenant
- Cannot change subscription plan

### End User
- Works on tasks
- Updates task status

---

## Functional Requirements

FR-001: The system shall allow tenant registration with unique subdomain  
FR-002: The system shall authenticate users using JWT  
FR-003: The system shall enforce role-based access control  
FR-004: The system shall isolate tenant data  
FR-005: The system shall allow tenant admins to create users  
FR-006: The system shall enforce subscription limits  
FR-007: The system shall allow project creation  
FR-008: The system shall allow task creation  
FR-009: The system shall support task assignment  
FR-010: The system shall log audit actions  
FR-011: The system shall support pagination  
FR-012: The system shall allow secure logout  
FR-013: The system shall support dashboard statistics  
FR-014: The system shall prevent cross-tenant access  
FR-015: The system shall support Docker deployment

---

## Non-Functional Requirements

NFR-001: API response time < 200ms  
NFR-002: JWT expiry 24 hours  
NFR-003: Supports 100 concurrent users  
NFR-004: 99% uptime  
NFR-005: Mobile responsive UI