
import { getSessionData } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSessionData(req);
  return NextResponse.json(session);
}
