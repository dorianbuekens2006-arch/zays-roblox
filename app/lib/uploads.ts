import "server-only";

import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { getUploadsDirectory } from "./database";

const signatures = [
  { mime: "image/png", extension: "png", test: (bytes: Uint8Array) => bytes.length > 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value) },
  { mime: "image/jpeg", extension: "jpg", test: (bytes: Uint8Array) => bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  { mime: "image/webp", extension: "webp", test: (bytes: Uint8Array) => bytes.length > 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" },
] as const;

export function maxUploadBytes() {
  const mb = Math.min(Math.max(Number(process.env.MAX_UPLOAD_MB) || 5, 1), 15);
  return mb * 1024 * 1024;
}

export async function storeValidatedImage(file: File) {
  if (!file.size || file.size > maxUploadBytes()) throw new Error("SIZE");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = signatures.find((signature) => signature.test(bytes));
  if (!type) throw new Error("TYPE");
  if (file.type && ![type.mime, type.mime === "image/jpeg" ? "image/jpg" : type.mime].includes(file.type)) throw new Error("TYPE");
  const fileName = `${randomUUID()}.${type.extension}`;
  await writeFile(path.join(getUploadsDirectory(), fileName), bytes, { flag: "wx" });
  return { fileName, mime: type.mime, size: bytes.byteLength };
}
