import { NextRequest } from "next/server";
import { getStoredObject } from "@/lib/storage";

function toWebStream(body: unknown) {
  if (!body) return null;
  if (body instanceof ReadableStream) return body;
  if (typeof body === "object" && "transformToWebStream" in body && typeof body.transformToWebStream === "function") {
    return body.transformToWebStream() as ReadableStream;
  }
  return null;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const filePath = key.join("/");

  try {
    const object = await getStoredObject(filePath);
    const stream = toWebStream(object.Body);

    if (!stream) return new Response("File tidak bisa dibaca", { status: 500 });

    return new Response(stream, {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": object.CacheControl ?? "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("File tidak ditemukan", { status: 404 });
  }
}
