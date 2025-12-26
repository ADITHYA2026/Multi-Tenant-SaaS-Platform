# Architecture Document

## 1. System Architecture Diagram

![System Architecture](images/system-architecture.png)

### Architecture Components:
1. **Client Layer**: Web browsers accessing the React frontend
2. **Frontend Layer**: React application served on port 3000
3. **Backend Layer**: Node.js/Express API server on port 5000
4. **Database Layer**: PostgreSQL database on port 5432
5. **Container Layer**: Docker containers managed by Docker Compose

### Data Flow:
1. User requests → Frontend (React) → Backend API
2. Backend processes → Database queries → Response to Frontend
3. Authentication: JWT tokens passed in Authorization headers

## 2. Database Schema Design

### Entity Relationship Diagram
![Database ERD](images/database-erd.png)

### Tables Description:

#### 1. tenants
- Stores organization/tenant information
- Key fields: id, name, subdomain, subscription_plan, max_users, max_projects
- Relationships: One-to-many with users, projects

#### 2. users
- Stores user accounts with tenant association
- Key fields: id, tenant_id, email, password_hash, role
- Constraints: UNIQUE(tenant_id, email), FOREIGN KEY to tenants
- Special: super_admin has tenant_id = NULL

#### 3. projects
- Stores projects for each tenant
- Key fields: id, tenant_id, name, status, created_by
- Indexes: idx_projects_tenant_id for performance

#### 4. tasks
- Stores tasks within projects
- Key fields: id, project_id, tenant_id, title, status, priority, assigned_to
- Indexes: idx_tasks_tenant_project for join performance

#### 5. audit_logs
- Tracks all important system actions
- Key fields: tenant_id, user_id, action, entity_type, entity_id, ip_address
- Purpose: Security monitoring and compliance

### Database Constraints:
- All foreign keys have ON DELETE CASCADE
- Email unique per tenant (not globally)
- ENUM types for status fields
- Timestamps for all created_at/updated_at

## 3. API Architecture

### Authentication Module
1. **POST /api/auth/register-tenant** - Register new tenant organization
2. **POST /api/auth/login** - User login (returns JWT token)
3. **GET /api/auth/me** - Get current user info (requires auth)
4. **POST /api/auth/logout** - User logout (requires auth)

### Tenant Management Module
5. **GET /api/tenants/:tenantId** - Get tenant details (requires auth)
6. **PUT /api/tenants/:tenantId** - Update tenant (requires tenant_admin or super_admin)
7. **GET /api/tenants** - List all tenants (requires super_admin only)

### User Management Module
8. **POST /api/tenants/:tenantId/users** - Add user to tenant (requires tenant_admin)
9. **GET /api/tenants/:tenantId/users** - List tenant users (requires tenant access)
10. **PUT /api/users/:userId** - Update user (requires tenant_admin or self)
11. **DELETE /api/users/:userId** - Delete user (requires tenant_admin)

### Project Management Module
12. **POST /api/projects** - Create project (requires auth)
13. **GET /api/projects** - List projects (requires auth)
14. **PUT /api/projects/:projectId** - Update project (requires creator or tenant_admin)
15. **DELETE /api/projects/:projectId** - Delete project (requires creator or tenant_admin)

### Task Management Module
16. **POST /api/projects/:projectId/tasks** - Create task (requires auth)
17. **GET /api/projects/:projectId/tasks** - List project tasks (requires auth)
18. **PATCH /api/tasks/:taskId/status** - Update task status (requires auth)
19. **PUT /api/tasks/:taskId** - Update task (requires auth)

### System Module
20. **GET /api/health** - Health check endpoint (public)

### Authentication Requirements:
- 🔒 = Requires authentication
- 👑 = Requires super_admin role
- 🏢 = Requires tenant_admin role
- ✏️ = Requires project creator or tenant_admin

### Response Format:
All APIs return consistent format:
```json
{
  "success": boolean,
  "message": "string",
  "data": object
}