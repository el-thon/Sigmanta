import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";
import { errorResponse, success } from "@/lib/response";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Input login tidak valid", 422);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return errorResponse("Email atau password salah", 401);

  const valid = await bcrypt.compare(parsed.data.password, user.password);
  if (!valid) return errorResponse("Email atau password salah", 401);

  const token = await signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
  await setAuthCookie(token);

  return success({ message: "Login berhasil", user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
