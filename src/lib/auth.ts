import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        token.id = u.id as string;
        token.username = u.username as string;
        token.displayName = u.displayName as string;
        token.level = u.level as number;
        token.xp = u.xp as number;
        token.coins = u.coins as number;
        token.equippedAvatar = u.equippedAvatar as string;
        token.equippedBorder = u.equippedBorder as string;
        token.equippedTitle = u.equippedTitle as string;
        token.equippedEmote = u.equippedEmote as string;
        token.equippedVoteEffect = u.equippedVoteEffect as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.displayName = token.displayName as string;
        session.user.level = token.level as number;
        session.user.xp = token.xp as number;
        session.user.coins = token.coins as number;
        session.user.equippedAvatar = token.equippedAvatar as string;
        session.user.equippedBorder = token.equippedBorder as string;
        session.user.equippedTitle = token.equippedTitle as string;
        session.user.equippedEmote = token.equippedEmote as string;
        session.user.equippedVoteEffect = token.equippedVoteEffect as string;
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          username: user.username,
          displayName: user.displayName,
          level: user.level,
          xp: user.xp,
          coins: user.coins,
          equippedAvatar: user.equippedAvatar,
          equippedBorder: user.equippedBorder,
          equippedTitle: user.equippedTitle,
          equippedEmote: user.equippedEmote,
          equippedVoteEffect: user.equippedVoteEffect,
        };
      },
    }),
  ],
});
