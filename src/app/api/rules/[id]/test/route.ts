import { NextRequest, NextResponse } from 'next/server';
import { queryOne, rowToRule } from '@/lib/db';
import { testRule } from '@/lib/inference';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rule = await queryOne('SELECT * FROM inference_rules WHERE id = $1', [id]);
  if (!rule) return NextResponse.json({ error: '규칙을 찾을 수 없습니다' }, { status: 404 });

  const result = await testRule(rowToRule(rule));
  return NextResponse.json({ success: true, data: result });
}
