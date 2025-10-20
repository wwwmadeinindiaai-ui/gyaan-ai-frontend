import NextAuth from "next-auth";
import { FirestoreAdapter } from "@next-auth/firebase-adapter";
import { getAdminDb } from "@/lib/firebase-admin";

const handler = NextAuth({
  adapter: FirestoreAdapter(getAdminDb()),
  providers: [
    // your auth providers here
  ],
  session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };
