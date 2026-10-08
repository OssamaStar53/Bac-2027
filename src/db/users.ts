import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, additionalData?: Partial<typeof users.$inferInsert>) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        ...(additionalData || {}),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(additionalData || {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('getOrCreateUser failed:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

export async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('getUserByUid failed:', error);
    throw new Error('Database query failed', { cause: error });
  }
}
