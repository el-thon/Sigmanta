import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getCurrentUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, success } from "@/lib/response";

const updateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional().or(z.literal("")),
  role: z.enum(["admin", "user"]),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  institution: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  age: z.number().int().min(10).max(120).optional().nullable(),
  bio: z.string().optional().nullable(),
});

function serializeUser(user: Awaited<ReturnType<typeof prisma.user.findFirstOrThrow>>) {
  const { password: _, ...safeUser } = user;
  return safeUser;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUserRecord();
  if (!currentUser) return errorResponse("Belum login", 401);
  if (currentUser.role !== "admin") return errorResponse("Akses admin diperlukan", 403);

  const { id } = await params;
  const userId = Number(id);
  const parsed = updateUserSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Input user tidak valid", 422);

  const emailOwner = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (emailOwner && emailOwner.id !== userId) return errorResponse("Email sudah digunakan user lain", 409);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      phone: parsed.data.phone,
      address: parsed.data.address,
      institution: parsed.data.institution,
      occupation: parsed.data.occupation,
      age: parsed.data.age,
      bio: parsed.data.bio,
      ...(parsed.data.password ? { password: await bcrypt.hash(parsed.data.password, 10) } : {}),
    },
  });

  return success({ message: "User berhasil diperbarui", user: serializeUser(user) });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUserRecord();
  if (!currentUser) return errorResponse("Belum login", 401);
  if (currentUser.role !== "admin") return errorResponse("Akses admin diperlukan", 403);

  const { id } = await params;
  const userId = Number(id);
  if (userId === currentUser.id) return errorResponse("Admin tidak bisa menghapus akun sendiri", 400);

  await prisma.user.delete({ where: { id: userId } });
  return success({ message: "User berhasil dihapus" });
}
