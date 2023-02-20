import NextAuth, { type NextAuthOptions, type PagesOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from '@next-auth/prisma-adapter';

import { prisma } from '@/server/db';
import { hashPassword, verifyPassword } from '@/utils/auth';

export const authOptions: NextAuthOptions = {
  // Include user.id on session
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        return { ...session, user: { ...session.user, id: user.id } };
      }
      return session;
    },
  },
  pages: {
    signUp: '/signup',
    signIn: '/signin',
  } as Partial<PagesOptions>,
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'app-login',
      name: 'App Login',
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

          return {
            id: maybeUser.id,
            email: maybeUser.email,
            name: maybeUser.name,
          };
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
};

export default NextAuth(authOptions);
