
import { getSessionData, sealData, sessionOptions } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSessionData(req);
  
  // Clear session data
  session.isLoggedIn = false;
  session.isAdmin = false;
  session.officerName = undefined;

  const encryptedSession = await sealData(session, { password: sessionOptions.password });

  const response = NextResponse.redirect(new URL('/login', req.url));
  
  // Set a new cookie with the cleared session and expire it immediately
  response.cookies.set({
      name: sessionOptions.cookieName,
      value: encryptedSession,
      ...sessionOptions.cookieOptions,
      maxAge: -1, // Expire the cookie
  });
  
  return response;
}
