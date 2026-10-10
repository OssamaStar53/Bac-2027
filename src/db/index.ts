import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err: any) => {
      // Benign network drops when Cloud SQL idle socket closes
      if (
        err?.code === 'ECONNRESET' ||
        err?.code === 'EPIPE' ||
        err?.message?.includes('Connection terminated') ||
        err?.message?.includes('read ECONNRESET') ||
        err?.message?.includes('write EPIPE')
      ) {
        return;
      }
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });

// Helper to run DB queries with automatic retry on transient socket disconnects
export async function withDbRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || '';
      const code = err?.code || '';
      const causeMsg = err?.cause?.message || '';
      const isTransient =
        code === 'ECONNRESET' ||
        code === 'EPIPE' ||
        code === '57P01' ||
        code === '08006' ||
        code === '08003' ||
        msg.includes('ECONNRESET') ||
        msg.includes('EPIPE') ||
        msg.includes('Connection terminated') ||
        msg.includes('read ECONNRESET') ||
        msg.includes('write EPIPE') ||
        causeMsg.includes('ECONNRESET') ||
        causeMsg.includes('EPIPE') ||
        causeMsg.includes('Connection terminated');

      if (isTransient && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
