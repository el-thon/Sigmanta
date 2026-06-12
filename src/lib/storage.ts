import path from "node:path";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type R2StorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
};

let r2Client: S3Client | null = null;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} belum diatur.`);
  return value;
}

function getR2StorageConfig(): R2StorageConfig {
  return {
    endpoint: requiredEnv("R2_ENDPOINT"),
    region: process.env.R2_REGION ?? "auto",
    bucket: requiredEnv("R2_BUCKET"),
    accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    publicUrl: requiredEnv("R2_PUBLIC_URL").replace(/\/$/, ""),
  };
}

function getR2Client(config: R2StorageConfig) {
  if (!r2Client) {
    r2Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return r2Client;
}

export function getPublicStorageUrl(filePath: string) {
  const { publicUrl } = getR2StorageConfig();
  const normalizedPath = filePath.replace(/\\/g, "/").replace(/^\//, "");

  return `${publicUrl}/${normalizedPath}`;
}

export async function saveLocalUpload(file: File, folder = "") {
  const config = getR2StorageConfig();
  const extension = path.extname(file.name).toLowerCase();
  const filename = `${randomUUID()}${extension}`;
  const key = path.posix.join(folder, filename).replace(/^\//, "");
  const body = Buffer.from(await file.arrayBuffer());

  await getR2Client(config).send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: body,
    ContentLength: body.length,
    ContentType: file.type || "application/octet-stream",
    CacheControl: "public, max-age=31536000, immutable",
  }));

  return {
    path: key,
    url: getPublicStorageUrl(key),
  };
}
