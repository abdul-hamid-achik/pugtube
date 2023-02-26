import { prisma } from '@/server/db';
import { hashPassword, verifyPassword } from '@/utils/auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import * as Sentry from "@sentry/browser";
import Cookies from 'cookies';
import { NextApiRequest, NextApiResponse } from 'next';
import NextAuth, { SessionStrategy, type NextAuthOptions, type PagesOptions } from 'next-auth';
import { decode, encode } from "next-auth/jwt";
import CredentialsProvider from 'next-auth/providers/credentials';
import DiscordProvider from 'next-auth/providers/discord';
import GitHubProvider from 'next-auth/providers/github';
import { v4 as uuid } from 'uuid';


const session = {
  strategy: "jwt" as SessionStrategy,
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60, // 24 hours
}

const adapter = PrismaAdapter(prisma)

export const authOptions = (req: NextApiRequest, res: NextApiResponse): NextAuthOptions => ({
  session,
  secret: process.env.NEXTAUTH_SECRET as string,
  // Include user.id on session
  events: {
    async signOut({ token }) {
      res.setHeader("Set-Cookie", "cookieName=deleted;Max-Age=0;path=/;Domain=.pugtube.dev;");
    },
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        return { ...session, user: { ...session.user, id: user.id } };
      }
      return session;
    },

    async signIn({ user }) {
      if (
        req.query.nextauth?.includes("callback") &&
        req.query.nextauth?.includes("credentials") &&
        req.method === "POST"
      ) {
        if (user && "id" in user) {
          const sessionToken = uuid()
          const sessionExpiry = new Date(Date.now() + session.maxAge * 1000)
          const cookies = Cookies(req, res)

          await adapter.createSession({
            sessionToken: sessionToken,
            userId: user.id,
            expires: sessionExpiry,
          });

          cookies.set("next-auth.session-token", sessionToken, {
            expires: sessionExpiry,
          })
        }
      }
      return true
    },
  },
  pages: {
    signUp: '/signup',
    signIn: '/signin',
  } as Partial<PagesOptions>,
  // Configure one or more authentication providers
  adapter,

  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_ID as string,
      clientSecret: process.env.DISCORD_SECRET as string
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Account Credentials',
      credentials: {
        email: {
          label: 'Email Address',
          type: 'email',
          placeholder: 'john.doe@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
          placeholder: 'Your super secure password',
        },
      },
      async authorize(credentials: Record<'email' | 'password', string> | undefined) {
        if (!credentials || !credentials?.password || !credentials?.email) {
          throw new Error('Invalid Credentials');
        }

        try {
          let maybeUser = await prisma.user.findFirst({
            where: {
              email: credentials?.email,
            },
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
            },
          });


          if (!maybeUser) {
            if (!credentials?.password || !credentials?.email) {
              throw new Error('Invalid Credentials');
            }

            maybeUser = await prisma.user.create({
              data: {
                email: credentials?.email,
                password: await hashPassword(credentials?.password),
              },
              select: {
                id: true,
                email: true,
                password: true,
                name: true,
              },
            });
          } else {
            const isValid = await verifyPassword(
              credentials.password,
              maybeUser?.password || undefined,
            );

            if (!isValid) {
              throw new Error('Invalid Credentials');
            }
          }

          const user = {
            id: maybeUser.id,
            email: maybeUser.email as string,
            name: maybeUser.name as string,
          };


          Sentry.setUser(user);

          return user;
        } catch (error) {
          throw error;
        }
      },
    }),

    /**
     * ...add more providers here
     *
     * Most other providers require a bit more work than the Discord provider.
     * For example, the GitHub provider requires you to add the
     * `refresh_token_expires_in` field to the Account model. Refer to the
     * NextAuth.js docs for the provider you want to use. Example:
     * @see https://next-auth.js.org/providers/github
     */
  ],
  jwt: {
    encode(params) {
      if (
        req.query?.nextauth?.includes("callback") &&
        req.query?.nextauth?.includes("credentials") &&
        req.method === "POST"
      ) {
        const cookies = new Cookies(req, res)
        const cookie = cookies.get("next-auth.session-token")
        if (cookie) return cookie
        else return ""
      }
      // Revert to default behaviour when not in the credentials provider callback flow
      return encode(params)
    },
    async decode(params) {
      if (
        req.query?.nextauth?.includes("callback") &&
        req.query?.nextauth?.includes("credentials") &&
        req.method === "POST"
      ) {
        return null
      }
      // Revert to default behaviour when not in the credentials provider callback flow
      return decode(params)
    },
  },
});

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  // Do whatever you want here, before the request is passed down to `NextAuth`
  return await NextAuth(req, res, authOptions(req, res))
}