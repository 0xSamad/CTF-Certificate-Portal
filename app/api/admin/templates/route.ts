import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const paths = { participation: "participation-template.docx", top5: "top-5-template.docx" } as const;

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const kind = form.get("kind");
  const file = form.get("file");
  if ((kind !== "participation" && kind !== "top5") || !file || typeof file === "string" || !file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json({ error: "Upload a .docx participation or Top 5 template." }, { status: 400 });
  }
  const { error } = await getSupabaseAdmin().storage.from("certificate-templates")
    .upload(paths[kind], file, { upsert: true, contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, path: paths[kind] });
}
