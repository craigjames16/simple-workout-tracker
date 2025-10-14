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

          // Check if this is a signup request
          if (credentials.isSignUp === "true") {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
              where: { email: credentials.email },
            });

            if (existingUser) {
              throw new Error("User already exists with this email");
            }

            // Create new user
            const hashedPassword = await bcrypt.hash(credentials.password, 12);
            const user = await prisma.user.create({
              data: {
                email: credentials.email,
                password: hashedPassword,
              },
            });

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          } else {
            // Sign in request
            const user = await prisma.user.findUnique({
              where: { email: credentials.email },
            });

            if (!user || !user.password) {
              return null;
            }

            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              user.password
            );

            if (!isPasswordValid) {
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
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