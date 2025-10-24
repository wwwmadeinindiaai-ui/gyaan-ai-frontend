// src/types/next-auth.d.ts

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

// 1. Extend the User type to include 'id'
declare module "next-auth" {
  interface User extends DefaultUser {
    id: string; // The ID property from your database/adapter
  }
}

// 2. Extend the Session type to include 'id' on the user object
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string; // The ID property from your database/adapter
      // Include all default properties here if you want explicit control
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }
}

// 3. Extend the JWT token type
declare module "next-auth/jwt" {
  interface JWT {
    id: string; // The ID property passed to the JWT token
  }
}
