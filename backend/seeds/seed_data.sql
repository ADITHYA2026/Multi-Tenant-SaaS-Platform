-- SUPER ADMIN (tenant_id = NULL)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
SELECT
    uuid_generate_v4(),
    NULL,
    'superadmin@system.com',
    '$2b$10$Gcj5hNEJSS5S2bLmTouU7.YppCIPZG/VxqnbxRmidVLmFSbriY7hi',
    'System Admin',
    'super_admin'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'superadmin@system.com'
);

-- DEMO TENANT
INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
SELECT
    uuid_generate_v4(),
    'Demo Company',
    'demo',
    'active',
    'pro',
    25,
    15
WHERE NOT EXISTS (
    SELECT 1 FROM tenants WHERE subdomain = 'demo'
);

-- TENANT ADMIN
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
SELECT
    uuid_generate_v4(),
    t.id,
    'admin@demo.com',
    '$2b$10$jsOCEEeAGq3H7rirsUHeKOjRCIkjezMDVFrdmmKoonHlMi9v7VFj.',
    'Demo Admin',
    'tenant_admin'
FROM tenants t
WHERE t.subdomain = 'demo'
AND NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@demo.com'
);

-- REGULAR USERS
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
SELECT
    uuid_generate_v4(),
    t.id,
    'user1@demo.com',
    '$2b$10$pYWBYjyUo79JxlniR.opquF6litp7F2G9jexJxLnkiJD.usZR8CkK',
    'User One',
    'user'
FROM tenants t
WHERE t.subdomain = 'demo'
AND NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'user1@demo.com'
);

INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
SELECT
    uuid_generate_v4(),
    t.id,
    'user2@demo.com',
    '$2b$10$pYWBYjyUo79JxlniR.opquF6litp7F2G9jexJxLnkiJD.usZR8CkK',
    'User Two',
    'user'
FROM tenants t
WHERE t.subdomain = 'demo'
AND NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'user2@demo.com'
);

-- DEMO PROJECTS
INSERT INTO projects (id, tenant_id, name, description, status, created_by)
SELECT
    uuid_generate_v4(),
    t.id,
    'Project Alpha',
    'First demo project',
    'active',
    u.id
FROM tenants t
JOIN users u ON u.tenant_id = t.id AND u.role = 'tenant_admin'
WHERE t.subdomain = 'demo'
AND NOT EXISTS (
    SELECT 1 FROM projects WHERE name = 'Project Alpha' AND tenant_id = t.id
);

INSERT INTO projects (id, tenant_id, name, description, status, created_by)
SELECT
    uuid_generate_v4(),
    t.id,
    'Project Beta',
    'Second demo project',
    'active',
    u.id
FROM tenants t
JOIN users u ON u.tenant_id = t.id AND u.role = 'tenant_admin'
WHERE t.subdomain = 'demo'
AND NOT EXISTS (
    SELECT 1 FROM projects WHERE name = 'Project Beta' AND tenant_id = t.id
);

-- DEMO TASK
INSERT INTO tasks (
    id,
    project_id,
    tenant_id,
    title,
    description,
    status,
    priority,
    assigned_to
)
SELECT
    uuid_generate_v4(),
    p.id,
    p.tenant_id,
    'Initial Task',
    'Demo task for project',
    'todo',
    'medium',
    u.id
FROM projects p
JOIN users u ON u.tenant_id = p.tenant_id AND u.role = 'user'
WHERE p.name = 'Project Alpha'
AND NOT EXISTS (
    SELECT 1 FROM tasks WHERE title = 'Initial Task' AND project_id = p.id
)
LIMIT 1;