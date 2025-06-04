import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import sql from './connection';

interface Migration {
  version: string;
  name: string;
  filename: string;
  sql: string;
}

// Create migrations table if it doesn't exist
const createMigrationsTable = async (): Promise<void> => {
  await sql`
    CREATE TABLE IF NOT EXISTS migrations (
      version VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log('✅ Migrations table created/verified');
};

// Get list of executed migrations
const getExecutedMigrations = async (): Promise<string[]> => {
  const result = await sql`
    SELECT version FROM migrations ORDER BY version ASC
  `;
  return result.map(row => row.version);
};

// Load migration files from the migrations directory
const loadMigrationFiles = async (): Promise<Migration[]> => {
  const migrationsDir = join(__dirname, 'migrations');
  const files = await readdir(migrationsDir);
  
  const migrations: Migration[] = [];
  
  for (const filename of files.filter(f => f.endsWith('.sql'))) {
    const filePath = join(migrationsDir, filename);
    const content = await readFile(filePath, 'utf-8');
    
    // Extract version and name from filename (e.g., "001_create_categories_table.sql")
    const match = filename.match(/^(\d+)_(.+)\.sql$/);
    if (!match) {
      console.warn(`⚠️  Skipping invalid migration filename: ${filename}`);
      continue;
    }
    
    const [, version, name] = match;
    migrations.push({
      version: version.padStart(3, '0'), // Ensure 3-digit version
      name: name.replace(/_/g, ' '),
      filename,
      sql: content.trim()
    });
  }
  
  return migrations.sort((a, b) => a.version.localeCompare(b.version));
};

// Execute a single migration
const executeMigration = async (migration: Migration): Promise<void> => {
  console.log(`🔄 Running migration ${migration.version}: ${migration.name}`);
  
  try {
    // Run the migration SQL
    await sql.begin(async sql => {
      // Execute the migration SQL
      await sql.unsafe(migration.sql);
      
      // Record the migration as executed
      await sql`
        INSERT INTO migrations (version, name) 
        VALUES (${migration.version}, ${migration.name})
      `;
    });
    
    console.log(`✅ Migration ${migration.version} completed successfully`);
  } catch (error) {
    console.error(`❌ Migration ${migration.version} failed:`, error);
    throw error;
  }
};

// Main migration function
const runMigrations = async (): Promise<void> => {
  console.log('🚀 Starting database migrations...\n');
  
  try {
    // Ensure migrations table exists
    await createMigrationsTable();
    
    // Load available migrations
    const availableMigrations = await loadMigrationFiles();
    console.log(`📂 Found ${availableMigrations.length} migration files`);
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    console.log(`📋 ${executedMigrations.length} migrations already executed`);
    
    // Find pending migrations
    const pendingMigrations = availableMigrations.filter(
      migration => !executedMigrations.includes(migration.version)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✨ No pending migrations. Database is up to date!');
      return;
    }
    
    console.log(`🔧 ${pendingMigrations.length} pending migrations to execute:\n`);
    
    // Execute pending migrations in order
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }
    
    console.log('\n✨ All migrations completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
};

// Rollback function (for future implementation)
const rollbackMigration = async (targetVersion?: string): Promise<void> => {
  console.log('⚠️  Rollback functionality not implemented yet');
  console.log('This feature will be added in a future version');
};

// CLI interface
const main = async (): Promise<void> => {
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
    case undefined:
      await runMigrations();
      break;
    case 'rollback':
      await rollbackMigration(process.argv[3]);
      break;
    case 'status':
      await showMigrationStatus();
      break;
    default:
      console.log('Usage: bun run migrate [up|rollback|status]');
      process.exit(1);
  }
  
  process.exit(0);
};

// Show migration status
const showMigrationStatus = async (): Promise<void> => {
  try {
    await createMigrationsTable();
    
    const availableMigrations = await loadMigrationFiles();
    const executedMigrations = await getExecutedMigrations();
    
    console.log('📊 Migration Status:\n');
    
    for (const migration of availableMigrations) {
      const isExecuted = executedMigrations.includes(migration.version);
      const status = isExecuted ? '✅' : '⏳';
      console.log(`${status} ${migration.version}: ${migration.name}`);
    }
    
    const pendingCount = availableMigrations.length - executedMigrations.length;
    console.log(`\n📈 Total: ${availableMigrations.length} migrations`);
    console.log(`✅ Executed: ${executedMigrations.length}`);
    console.log(`⏳ Pending: ${pendingCount}`);
    
  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.main) {
  main();
}

export { runMigrations, rollbackMigration, showMigrationStatus }; 