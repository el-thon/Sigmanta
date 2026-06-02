import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUserRecord, setAuthCookie, signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, success } from "@/lib/response";
import { saveLocalUpload } from "@/lib/storage";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  institution: z.string().optional(),
  occupation: z.string().optional(),
  age: z.number().int().min(10).max(120).optional().nullable(),
  bio: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  const currentUser = await getCurrentUserRecord();
  if (!currentUser) return errorResponse("Belum login", 401);

  const formData = await request.formData();
  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    institution: String(formData.get("institution") ?? ""),
    occupation: String(formData.get("occupation") ?? ""),
    age: formData.get("age") ? Number(formData.get("age")) : null,
    bio: String(formData.get("bio") ?? ""),
  });
  if (!parsed.success) return errorResponse("Input profil tidak valid", 422);

  const emailOwner = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (emailOwner && emailOwner.id !== currentUser.id) return errorResponse("Email sudah digunakan user lain", 409);

  const avatar = formData.get("avatar");
  const uploadedAvatar = avatar instanceof File && avatar.size > 0
    ? await saveLocalUpload(avatar, "avatars")
    : null;

  const user = await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      ...parsed.data,
      age: parsed.data.age,
      ...(uploadedAvatar ? { avatarUrl: uploadedAvatar.url } : {}),
    },
  });

  const token = await signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
  await setAuthCookie(token);

  return success({
    message: "Profil berhasil diperbarui",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
  });
}
