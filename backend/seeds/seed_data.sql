-- SUPER ADMIN (tenant_id = NULL)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
VALUES (
    uuid_generate_v4(),
    NULL,
    'superadmin@system.com',
    '$2b$10$YkD6nUj0nQqZ8KQ9m5XGSeFq9e0dJd7M6m5kZp5rYBz9Fqv3m7l7S',
    'System Admin',
    'super_admin'
);

-- DEMO TENANT
INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
VALUES (
    uuid_generate_v4(),
    'Demo Company',
    'demo',
    'active',
    'pro',
    25,
    15
);

-- TENANT ADMIN
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
SELECT
    uuid_generate_v4(),
    t.id,
    'admin@demo.com',
    '$2b$10$YkD6nUj0nQqZ8KQ9m5XGSeFq9e0dJd7M6m5kZp5rYBz9Fqv3m7l7S',
    'Demo Admin',
    'tenant_admin'
FROM tenants t WHERE subdomain = 'demo';

-- REGULAR USERS
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
SELECT uuid_generate_v4(), t.id, 'user1@demo.com',
'$2b$10$YkD6nUj0nQqZ8KQ9m5XGSeFq9e0dJd7M6m5kZp5rYBz9Fqv3m7l7S',
'User One', 'user'
FROM tenants t WHERE subdomain = 'demo';

INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
SELECT uuid_generate_v4(), t.id, 'user2@demo.com',
'$2b$10$YkD6nUj0nQqZ8KQ9m5XGSeFq9e0dJd7M6m5kZp5rYBz9Fqv3m7l7S',
'User Two', 'user'
FROM tenants t WHERE subdomain = 'demo';