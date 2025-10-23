// central NextAuth config for App Router
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { FirestoreAdapter } from "@next-auth/firebase-adapter";
import { getAdminDb } from "./firebase-admin";

export const authOptions: NextAuthOptions = {
  adapter: FirestoreAdapter(getAdminDb()),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
};
