# API Documentation – Multi-Tenant SaaS Platform

---

## Authentication Overview

All protected APIs require **JWT authentication**.

### Request Header
```http
Authorization: Bearer <JWT_TOKEN>
````

### JWT Payload

```json
{
  "userId": "uuid",
  "tenantId": "uuid | null",
  "role": "super_admin | tenant_admin | user"
}
```

* **Token Expiry:** 24 hours

---

## AUTHENTICATION APIs

### API 1: Register Tenant

* **Method:** POST
* **Endpoint:** `/api/auth/register-tenant`
* **Auth Required:** No

**Request Headers**

```http
Content-Type: application/json
```

**Request Body**

```json
{
  "tenantName": "Test Company Alpha",
  "subdomain": "testalpha",
  "adminEmail": "admin@testalpha.com",
  "adminPassword": "TestPass@123",
  "adminFullName": "Alpha Admin"
}
```

**Success Response (201)**

```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenantId": "uuid",
    "subdomain": "testalpha",
    "adminUser": {
      "id": "uuid",
      "email": "admin@testalpha.com",
      "fullName": "Alpha Admin",
      "role": "tenant_admin"
    }
  }
}
```

---

### API 2: Login

* **Method:** POST
* **Endpoint:** `/api/auth/login`
* **Auth Required:** No

**Request Headers**

```http
Content-Type: application/json
```

**Request Body**

```json
{
  "email": "admin@demo.com",
  "password": "Demo@123",
  "tenantSubdomain": "demo"
}
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@demo.com",
      "role": "tenant_admin",
      "tenantId": "uuid"
    },
    "token": "jwt-token",
    "expiresIn": 86400
  }
}
```

---

### API 3: Get Current User

* **Method:** GET
* **Endpoint:** `/api/auth/me`
* **Auth Required:** Yes (All roles)

**Request Headers**

```http
Authorization: Bearer <JWT_TOKEN>
```

**Request Body**

```json
{}
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@demo.com",
    "role": "tenant_admin",
    "isActive": true,
    "tenant": {
      "id": "uuid",
      "name": "Demo Company",
      "subscriptionPlan": "pro",
      "maxUsers": 25,
      "maxProjects": 15
    }
  }
}
```

---

### API 4: Logout

* **Method:** POST
* **Endpoint:** `/api/auth/logout`
* **Auth Required:** Yes

**Request Headers**

```http
Authorization: Bearer <JWT_TOKEN>
```

**Request Body**

```json
{}
```

**Success Response (200)**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## TENANT MANAGEMENT APIs

### API 5: Get Tenant Details

* **Method:** GET
* **Endpoint:** `/api/tenants/:tenantId`
* **Auth Required:** Yes (Tenant member or super_admin)

**Request Body**

```json
{}
```

**Success Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Demo Company",
    "subdomain": "demo",
    "status": "active",
    "subscriptionPlan": "pro",
    "maxUsers": 25,
    "maxProjects": 15,
    "stats": {
      "totalUsers": 3,
      "totalProjects": 2,
      "totalTasks": 5
    }
  }
}
```

---

### API 6: Update Tenant

* **Method:** PUT
* **Endpoint:** `/api/tenants/:tenantId`
* **Auth Required:** Yes
* **Role:** tenant_admin (name only) / super_admin (all fields)

**Request Body**

```json
{
  "name": "Updated Company Name"
}
```

**Success Response**

```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {
    "id": "uuid",
    "name": "Updated Company Name"
  }
}
```

---

### API 7: List All Tenants

* **Method:** GET
* **Endpoint:** `/api/tenants`
* **Auth Required:** Yes
* **Role:** super_admin only

**Request Body**

```json
{}
```

**Success Response**

```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": "uuid",
        "name": "Demo Company",
        "subdomain": "demo",
        "status": "active",
        "subscriptionPlan": "pro"
      }
    ]
  }
}
```

---

## USER MANAGEMENT APIs

### API 8: Add User

* **Method:** POST
* **Endpoint:** `/api/tenants/:tenantId/users`
* **Auth Required:** Yes
* **Role:** tenant_admin

**Request Body**

```json
{
  "email": "user3@demo.com",
  "password": "User@123",
  "fullName": "Demo User",
  "role": "user"
}
```

**Success Response**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "user3@demo.com",
    "role": "user"
  }
}
```

---

### API 9: List Users

* **Method:** GET
* **Endpoint:** `/api/tenants/:tenantId/users`
* **Auth Required:** Yes

**Request Body**

```json
{}
```

**Success Response**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user1@demo.com",
        "role": "user"
      }
    ]
  }
}
```

---

### API 10: Update User

* **Method:** PUT
* **Endpoint:** `/api/users/:userId`
* **Auth Required:** Yes

**Request Body**

```json
{
  "fullName": "Updated User Name"
}
```

**Success Response**

```json
{
  "success": true,
  "message": "User updated successfully"
}
```

---

### API 11: Delete User

* **Method:** DELETE
* **Endpoint:** `/api/users/:userId`
* **Auth Required:** Yes
* **Role:** tenant_admin

**Request Body**

```json
{}
```

**Success Response**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## PROJECT APIs

### API 12: Create Project

* **Method:** POST
* **Endpoint:** `/api/projects`
* **Auth Required:** Yes

**Request Body**

```json
{
  "name": "Website Redesign",
  "description": "Revamp company website"
}
```

**Success Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Website Redesign"
  }
}
```

---

### API 13: List Projects

* **Method:** GET
* **Endpoint:** `/api/projects`
* **Auth Required:** Yes

**Request Body**

```json
{}
```

**Success Response**

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "Website Redesign"
      }
    ]
  }
}
```

---

### API 14: Update Project

* **Method:** PUT
* **Endpoint:** `/api/projects/:projectId`
* **Auth Required:** Yes

**Request Body**

```json
{
  "status": "archived"
}
```

**Success Response**

```json
{
  "success": true,
  "message": "Project updated successfully"
}
```

---

### API 15: Delete Project

* **Method:** DELETE
* **Endpoint:** `/api/projects/:projectId`
* **Auth Required:** Yes

**Request Body**

```json
{}
```

**Success Response**

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

## TASK APIs

### API 16: Create Task

* **Method:** POST
* **Endpoint:** `/api/projects/:projectId/tasks`
* **Auth Required:** Yes

**Request Body**

```json
{
  "title": "Design Homepage",
  "priority": "high"
}
```

**Success Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "todo"
  }
}
```

---

### API 17: List Tasks

* **Method:** GET
* **Endpoint:** `/api/projects/:projectId/tasks`
* **Auth Required:** Yes

**Request Body**

```json
{}
```

**Success Response**

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "Design Homepage",
        "status": "todo"
      }
    ]
  }
}
```

---

### API 18: Update Task Status

* **Method:** PATCH
* **Endpoint:** `/api/tasks/:taskId/status`
* **Auth Required:** Yes

**Request Body**

```json
{
  "status": "completed"
}
```

**Success Response**

```json
{
  "success": true,
  "data": {
    "status": "completed"
  }
}
```

---

### API 19: Update Task

* **Method:** PUT
* **Endpoint:** `/api/tasks/:taskId`
* **Auth Required:** Yes

**Request Body**

```json
{
  "priority": "medium"
}
```

**Success Response**

```json
{
  "success": true,
  "message": "Task updated successfully"
}
```