import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // or "../auth/..." → prefer lib import

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function GET(_: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ref = doc(db, "preferences", session.user!.email!);
  const snap = await getDoc(ref);
  return NextResponse.json(snap.exists() ? snap.data() : {});
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ref = doc(db, "preferences", session.user!.email!);
  await setDoc(ref, body, { merge: true });
  return NextResponse.json({ ok: true });
}
