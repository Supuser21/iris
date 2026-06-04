import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  userId?: string;
  phone?: string;
};

export const sessionOptions: SessionOptions = {
  password: process.env.AUTH_SECRET ?? "dev-secret-change-in-production-32chars",
  cookieName: "iris_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireUserId(): Promise<string | null> {
  const session = await getSession();
  return session.userId ?? null;
}
