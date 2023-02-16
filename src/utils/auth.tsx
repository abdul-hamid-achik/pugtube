import { hash, compare } from 'bcryptjs';
import type { DefaultSession } from 'next-auth';
import type {
  GetSessionParams,
} from 'next-auth/react';
import {
  getSession as getNextSession,
} from 'next-auth/react';

type DefaultSessionUser = NonNullable<DefaultSession['user']>;

type SessionUser = DefaultSessionUser & {
  id: string;
  role: string;
};

export type Session = DefaultSession & {
  user?: SessionUser;
};

export async function getSession(
  options: GetSessionParams,
): Promise<Session | null> {
  const session = await getNextSession(options);

  // that these are equal are ensured in `[...nextauth]`'s callback
  return session as Session | null;
}

export async function hashPassword(password: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return hash(password, 12);
}

export async function verifyPassword(password?: string, hashedPassword?: string) {
  if (!password || !hashedPassword) return false;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return compare(password, hashedPassword);
}
