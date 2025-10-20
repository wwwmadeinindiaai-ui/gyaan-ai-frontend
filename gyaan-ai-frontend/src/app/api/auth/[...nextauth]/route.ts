import NextAuth from "next-auth";
import { FirestoreAdapter } from "@next-auth/firebase-adapter";
import { getAdminDb } from "@/lib/firebase-admin";
import type { Firestore as AdminFirestore } from "firebase-admin/firestore";

const adminDb: AdminFirestore = getAdminDb();

const handler = NextAuth({
  adapter: FirestoreAdapter(adminDb),
  providers: [
    // your auth providers here
  ],
  session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };
