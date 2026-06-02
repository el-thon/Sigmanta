import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";
import { errorResponse, success } from "@/lib/response";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Input register tidak valid", 422);

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return errorResponse("Email sudah terdaftar", 409);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: await bcrypt.hash(parsed.data.password, 10),
    },
  });

  const token = await signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
  await setAuthCookie(token);

  return success({ message: "Register berhasil", user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 201);
}
