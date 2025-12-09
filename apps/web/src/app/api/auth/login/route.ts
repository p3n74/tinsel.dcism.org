
import { getSessionData, sealData, sessionOptions } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { officerName, passcode } = await req.json();

  if (!officerName || !passcode) {
    return NextResponse.json({ message: 'Officer name and passcode are required.' }, { status: 400 });
  }

  if (passcode !== process.env.PASSCODE) {
    return NextResponse.json({ message: 'Invalid passcode.' }, { status: 401 });
  }

  const session = await getSessionData(req);
  session.officerName = officerName;
  session.isLoggedIn = true;

  const encryptedSession = await sealData(session, { password: sessionOptions.password });

  const response = NextResponse.json({ message: 'Login successful.' });
  response.cookies.set(sessionOptions.cookieName, encryptedSession, sessionOptions.cookieOptions);
  
  return response;
}
