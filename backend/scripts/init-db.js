const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'database',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'saas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runSqlFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    // Split by semicolon to execute statements separately
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
    console.log(`✓ Executed ${path.basename(filePath)}`);
  } catch (err) {
    console.error(`✗ Error executing ${filePath}:`, err.message);
    throw err;
  }
}

async function waitForDatabase(maxAttempts = 30) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('✓ Database is ready');
      return true;
    } catch (err) {
      console.log(`Waiting for database... (attempt ${i}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Database connection failed after multiple attempts');
}

(async () => {
  try {
    console.log('Starting database initialization...');
    
    // Wait for database to be ready
    await waitForDatabase();
    
    // Run migrations
    console.log('Running migrations...');
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      await runSqlFile(path.join(migrationsDir, file));
    }
    
    // Run seed data
    console.log('Seeding database...');
    const seedFile = path.join(__dirname, '../seeds/seed_data_fixed.sql');
    if (fs.existsSync(seedFile)) {
      await runSqlFile(seedFile);
    } else {
      console.log('Seed file not found, using default seed data');
      await runSqlFile(path.join(__dirname, '../seeds/seed_data.sql'));
    }
    
    console.log('Database initialized successfully!');
    
    // Test data exists
    const superAdminCheck = await pool.query(
      "SELECT COUNT(*) FROM users WHERE email = 'superadmin@system.com'"
    );
    const tenantCheck = await pool.query(
      "SELECT COUNT(*) FROM tenants WHERE subdomain = 'demo'"
    );
    
    console.log(`Super admin exists: ${superAdminCheck.rows[0].count > 0 ? '✓' : '✗'}`);
    console.log(`Demo tenant exists: ${tenantCheck.rows[0].count > 0 ? '✓' : '✗'}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  }
})();