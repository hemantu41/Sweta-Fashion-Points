import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export type SessionData = {
  mobile?: string;
  isLoggedIn?: boolean;
};

export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'dev-secret-replace-in-production-must-be-long',
  cookieName: 'ifp-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax' as const,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
