import { NextResponse } from 'next/server';
import { initializeDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

let initialized = false;

export async function ensureInitialized() {
  if (!initialized) {
    await initializeDb();
    await seedDatabase();
    initialized = true;
  }
}

export async function GET() {
  await ensureInitialized();
  return NextResponse.json({ success: true, message: '초기화 완료' });
}
