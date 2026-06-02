import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
const cookieName = "sigmita_token";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "user";
};

export async function signToken(user: AuthUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token?: string | null): Promise<AuthUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as AuthUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const store = await cookies();
  return verifyToken(store.get(cookieName)?.value);
}

export async function getCurrentUserRecord() {
  const user = await getCurrentUser();
  if (!user) return null;

  return prisma.user.findUnique({
    where: { id: user.id },
  });
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(cookieName);
}
