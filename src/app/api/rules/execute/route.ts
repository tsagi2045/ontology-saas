import { NextResponse } from 'next/server';
import { executeAllRules } from '@/lib/inference';

export async function POST() {
  const results = await executeAllRules();
  return NextResponse.json({ success: true, data: results });
}
