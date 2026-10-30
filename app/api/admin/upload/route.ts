import { NextResponse } from "next/server";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);
const maxFileSize = 50 * 1024 * 1024;

function validateFile(name: string, type: string, size: number) {
  if (!name || !Number.isFinite(size) || size < 1) return "Choose a file first.";
  if (size > maxFileSize) return "Files must be 50 MB or smaller.";
  if (!allowedTypes.has(type)) return "Only JPG, PNG, WEBP, GIF, and PDF files are allowed.";
  return null;
}

function storagePath(name: string) {
  const extension = name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "file";
  return `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension.toLowerCase()}`;
}

export async function POST(request: Request) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Vercel limits the body of a serverless request well below our 50 MB upload
  // limit. For large files, issue a one-time Storage token and let the browser
  // upload directly to the private bucket instead of proxying bytes through Vercel.
  if (request.headers.get("content-type")?.includes("application/json")) {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name : "";
    const type = typeof body.type === "string" ? body.type : "";
    const size = Number(body.size);
    const validationError = validateFile(name, type, size);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    const path = storagePath(name);
    const { data, error } = await getSupabaseAdmin().storage.from("course-files").createSignedUploadUrl(path);
    if (error || !data) return NextResponse.json({ error: error?.message || "Could not prepare the upload." }, { status: 400 });
    return NextResponse.json({ path, name, token: data.token });
  }
  const data = await request.formData(); const file = data.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file first." }, { status: 400 });
  const validationError = validateFile(file.name, file.type, file.size);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  const path = storagePath(file.name);
  const { error } = await getSupabaseAdmin().storage.from("course-files").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type || undefined, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ path, name: file.name });
}
