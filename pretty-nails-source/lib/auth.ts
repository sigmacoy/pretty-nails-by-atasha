import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();
        const password = parsed.data.password;

        // Auto-provision demo accounts if logging in with demo credentials
        if (email === "owner@prettynails.com" && password === "owner123") {
          let owner = await prisma.user.findUnique({ where: { email } });
          if (!owner) {
            const hashed = await bcrypt.hash("owner123", 10);
            owner = await prisma.user.create({
              data: {
                email,
                name: "Ma'am Atasha (Owner)",
                password: hashed,
                role: "ADMIN",
                phone: "0977 284 6167",
              },
            });
          } else if (owner.role !== "ADMIN") {
            owner = await prisma.user.update({
              where: { email },
              data: { role: "ADMIN" },
            });
          }
          return {
            id: owner.id,
            email: owner.email,
            name: owner.name,
            role: owner.role,
            createdAt: owner.createdAt,
          };
        }

        if (email === "client@prettynails.com" && password === "client123") {
          let client = await prisma.user.findUnique({ where: { email } });
          if (!client) {
            const hashed = await bcrypt.hash("client123", 10);
            client = await prisma.user.create({
              data: {
                email,
                name: "Maria Santos (Loyal Client)",
                password: hashed,
                role: "CUSTOMER",
                phone: "0917 123 4567",
              },
            });
            // Ensure loyalty card exists
            await prisma.loyaltyCard.create({
              data: {
                userId: client.id,
                stampCount: 0,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              },
            });
          }
          return {
            id: client.id,
            email: client.email,
            name: client.name,
            role: client.role,
            createdAt: client.createdAt,
          };
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "CUSTOMER";
        token.createdAt = (user as any).createdAt;
      }
      if (trigger === "update" && session) {
        token.name = session.name;
        token.image = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "CUSTOMER";
        (session.user as any).createdAt = token.createdAt;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (existingUser) {
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            update: {},
            create: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state ? String(account.session_state) : null,
            },
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      createdAt?: Date | string | null;
      nickname?: string | null;
    };
  }
  interface User {
    role?: string;
    createdAt?: Date | string | null;
  }
}
