const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query(sql);
}

(async () => {
  try {
    console.log('Running migrations...');
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir).sort();

    for (const file of migrationFiles) {
      await runSqlFile(path.join(migrationsDir, file));
      console.log(`Executed ${file}`);
    }

    console.log('Running seed data...');
    const seedFile = path.join(__dirname, '../seeds/seed_data.sql');
    await runSqlFile(seedFile);

    console.log('Database initialized successfully');
    process.exit(0);
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
})();