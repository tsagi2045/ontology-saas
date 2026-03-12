import { NextResponse } from 'next/server';
import { ensureInitialized } from '../../init/route';
import { executeAllRules } from '@/lib/inference';

export async function POST() {
  await ensureInitialized();
  const results = await executeAllRules();
  return NextResponse.json({ success: true, data: results });
}
