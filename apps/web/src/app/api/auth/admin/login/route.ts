
import { getSessionData, sealData, sessionOptions } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { passcode } = await req.json();

  if (!passcode) {
    return NextResponse.json({ message: 'Passcode is required.' }, { status: 400 });
  }

  if (passcode !== process.env.ADMIN_PASSCODE) {
    return NextResponse.json({ message: 'Invalid admin passcode.' }, { status: 401 });
  }

  const session = await getSessionData(req);
  session.isAdmin = true;
  
  const encryptedSession = await sealData(session, { password: sessionOptions.password });

  const response = NextResponse.json({ message: 'Admin login successful.' });
  response.cookies.set(sessionOptions.cookieName, encryptedSession, sessionOptions.cookieOptions);

  return response;
}
