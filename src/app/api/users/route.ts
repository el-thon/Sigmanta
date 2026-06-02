import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getCurrentUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, success } from "@/lib/response";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "user"]).default("user"),
  phone: z.string().optional(),
  address: z.string().optional(),
  institution: z.string().optional(),
  occupation: z.string().optional(),
  age: z.number().int().min(10).max(120).optional().nullable(),
});

function serializeUser(user: Awaited<ReturnType<typeof prisma.user.findFirstOrThrow>>) {
  const { password: _, ...safeUser } = user;
  return safeUser;
}

export async function GET() {
  const currentUser = await getCurrentUserRecord();
  if (!currentUser) return errorResponse("Belum login", 401);
  if (currentUser.role !== "admin") return errorResponse("Akses admin diperlukan", 403);

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return success({ users: users.map(serializeUser) });
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUserRecord();
  if (!currentUser) return errorResponse("Belum login", 401);
  if (currentUser.role !== "admin") return errorResponse("Akses admin diperlukan", 403);

  const parsed = createUserSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Input user tidak valid", 422);

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return errorResponse("Email sudah digunakan", 409);

  const user = await prisma.user.create({
    data: {
      ...parsed.data,
      age: parsed.data.age ?? undefined,
      password: await bcrypt.hash(parsed.data.password, 10),
    },
  });

  return success({ message: "User berhasil dibuat", user: serializeUser(user) }, 201);
}
