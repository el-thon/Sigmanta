import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

export type LocalStorageConfig = {
  directory: string;
  absoluteDirectory: string;
  publicUrl: string;
};

export function getLocalStorageConfig(): LocalStorageConfig {
  const directory = process.env.LOCAL_STORAGE_DIR ?? "public/uploads";
  const publicUrl = process.env.NEXT_PUBLIC_LOCAL_STORAGE_URL ?? "/uploads";

  return {
    directory,
    absoluteDirectory: path.isAbsolute(directory) ? directory : path.join(process.cwd(), directory),
    publicUrl: publicUrl.replace(/\/$/, ""),
  };
}

export function getPublicStorageUrl(filePath: string) {
  const { publicUrl } = getLocalStorageConfig();
  const normalizedPath = filePath.replace(/\\/g, "/").replace(/^\//, "");

  return `${publicUrl}/${normalizedPath}`;
}

export function getLocalStoragePath(filePath: string) {
  const { absoluteDirectory } = getLocalStorageConfig();
  const normalizedPath = filePath.replace(/\\/g, "/").replace(/^\//, "");

  return path.join(absoluteDirectory, normalizedPath);
}

export async function saveLocalUpload(file: File, folder = "") {
  const extension = path.extname(file.name).toLowerCase();
  const filename = `${randomUUID()}${extension}`;
  const relativePath = path.join(folder, filename).replace(/\\/g, "/");
  const absolutePath = getLocalStoragePath(relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return {
    path: relativePath,
    url: getPublicStorageUrl(relativePath),
  };
}
