import NextAuth, {Session, User} from "next-auth";
import {JWT} from "next-auth/jwt";
import jwtDecode from "jwt-decode";
import CredentialsProvider from "next-auth/providers/credentials";
import {AuthApi, Configuration, TokenRefresh} from '../../../client';

const authApi = new AuthApi(new Configuration({basePath: process.env.NEXT_PUBLIC_API_BASE_PATH}));

interface CustomSession extends Session {
    access: string;
    refresh: string;
    exp: number;
}
async function refreshAccessToken(token: JWT) {
        console.log(token, 'token')
        const {data, status} = await authApi.createTokenRefresh(token.refresh as TokenRefresh);
        console.log(data, status);
        const {exp}: JWT = jwtDecode(data.access as string);
        return {
            ...token,
            ...data,
            exp,
        };
}

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions = {
    // https://next-auth.js.org/configuration/providers/oauth
    providers: [
        CredentialsProvider({
            // The name to display on the sign in form (e.g. 'Sign in with...')
            name: "Pugtube",
            // The credentials is used to generate a suitable form on the sign in page.
            // You can specify whatever fields you are expecting to be submitted.
            // e.g. domain, username, password, 2FA token, etc.
            credentials: {
                username: {
                    label: "Username",
                    type: "username",
                    placeholder: "username",
                },
                password: {label: "Password", type: "password"},
            },

            // @ts-ignore
            async authorize(credentials) {
                try {
                    const {data: token} = await authApi.createTokenObtainPair(credentials);
                    // @ts-ignore
                    const {username, email, user_id, exp, is_superuser, is_staff}: any =
                        // @ts-ignore
                        jwtDecode(token?.access as string);
                    return {
                        ...token,
                        exp,
                        user: {
                            username,
                            email,
                            user_id,
                            is_staff,
                            is_superuser,
                        },
                    };
                } catch (error) {
                    return null;
                }
            },
        }),
    ],
    theme: {
        colorScheme: "dark",
    },
    callbacks: {
        async redirect({url, baseUrl}: { url: string; baseUrl: string }) {
            return url.startsWith(baseUrl)
                ? Promise.resolve(url)
                : Promise.resolve(baseUrl);
        },
        async jwt({
                      token,
                      user,
                      account,
                      profile,
                      isNewUser
                  }: { token: { exp: number }; user: User; account: any; profile: any; isNewUser: boolean }) {
            // initial signin
            if (account && user) {
                return user;
            }

            // Return previous token if the access token has not expired
            if (Date.now() < token.exp * 100) {
                return token;
            }

            // refresh token
            return refreshAccessToken(token);
        },
        async session({
                          session,
                          user,
                          token
                      }: { session: CustomSession, user: User, token: JWT }) {
            session.user = token.user as User;
            // @ts-ignore
            session.access = token.access;
            // @ts-ignore
            session.refresh = token.refresh;
            // @ts-ignore
            session.exp = token.exp;
            return session;
        },
    },
    session: {strategy: "jwt"},
};

// @ts-ignore
export default NextAuth(authOptions);