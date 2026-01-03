import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
          isSignUp: { label: "Is Sign Up", type: "text" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          try {
            const { authenticateUser } = await import("@/lib/mobileAuth");
            const user = await authenticateUser(
              credentials.email,
              credentials.password,
              credentials.isSignUp === "true"
            );

            if (!user) {
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          } catch (error: any) {
            // Re-throw errors (like "User already exists") so NextAuth can handle them
            throw error;
          }
        },
      }),
    ],
    pages: {
      signIn: '/signin',
      error: '/error',
    },
    session: {
      strategy: "jwt",
    },
    callbacks: {
      session: async ({ session, token }) => {
        if (session?.user && token?.sub) {
          session.user.id = token.sub;
        }
        return session;
      },
      jwt: async ({ user, token }) => {
        if (user) {
          token.sub = user.id;
        }
        return token;
      },
    },
  }