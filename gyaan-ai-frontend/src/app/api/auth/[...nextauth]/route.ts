import NextAuth from "next-auth";
import { authOptions as importedAuthOptions } from "@/lib/auth";
const authOptions = importedAuthOptions;
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
