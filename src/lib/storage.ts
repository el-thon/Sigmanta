import path from "node:path";

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
