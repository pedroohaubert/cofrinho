import postgres from 'postgres';

// Create database connection using the connection string directly
const createDatabaseConnection = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    // Use the connection string directly - postgres library handles all parameters including SSL
    return postgres(databaseUrl, {
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      transform: {
        undefined: null, // Transform undefined to null for PostgreSQL
      },
      debug: process.env.NODE_ENV === 'development' ? console.log : false,
    });
  }

  // Fallback to individual environment variables for local development
  return postgres({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'cofrinho',
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    ssl: process.env.NODE_ENV === 'production',
    transform: {
      undefined: null, // Transform undefined to null for PostgreSQL
    },
    debug: process.env.NODE_ENV === 'development' ? console.log : false,
  });
};

export const sql = createDatabaseConnection();

// Health check function
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await sql.end();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

export default sql; 