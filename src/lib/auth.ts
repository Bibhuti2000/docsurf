import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: '/auth',
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        let user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // For demo purposes, auto-register if user doesn't exist
        if (!user) {
          const hashedPassword = await bcrypt.hash(credentials.password as string, 10);
          user = await prisma.user.create({
            data: {
              email: credentials.email as string,
              password: hashedPassword,
              name: (credentials.email as string).split('@')[0],
            }
          });
        } else {
          const isValid = await bcrypt.compare(credentials.password as string, user.password!);
          if (!isValid) return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
});
