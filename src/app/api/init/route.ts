import { NextResponse } from 'next/server';
import { initializeDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

let initialized = false;

export async function ensureInitialized() {
  if (!initialized) {
    try {
      await initializeDb();
      await seedDatabase();
      initialized = true;
    } catch (error) {
      console.error('DB 초기화 실패:', error);
      throw error;
    }
  }
}

export async function GET() {
  try {
    await ensureInitialized();
    return NextResponse.json({ success: true, message: '초기화 완료' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
