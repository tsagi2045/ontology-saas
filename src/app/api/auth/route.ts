import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = process.env.SITE_PASSWORD || 'Myverse';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body;

  if (password === PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('kg_auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return response;
  }

  return NextResponse.json({ success: false, error: '비밀번호가 올바르지 않습니다' }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('kg_auth');
  return response;
}
