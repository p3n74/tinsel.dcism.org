import { sealData, unsealData, IronSessionData } from 'iron-session';
import { NextRequest } from 'next/server';

export interface SessionData {
  officerName?: string;
  isLoggedIn?: boolean;
  isAdmin?: boolean;
}

export const sessionOptions = {
  cookieName: 'tinsel_treats_session',
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    path: '/',
  },
};

export async function getSessionData(req: NextRequest): Promise<SessionData> {
  const cookie = req.cookies.get(sessionOptions.cookieName);
  if (!cookie?.value) {
    return {};
  }
  
  try {
    const sessionData = await unsealData<SessionData>(cookie.value, {
      password: sessionOptions.password,
    });
    return sessionData;
  } catch (error) {
    console.error("Error unsealing session:", error);
    return {};
  }
}

export { sealData };
