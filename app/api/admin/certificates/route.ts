import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("certificates").select("*").order("issued_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const certificates = await Promise.all((data ?? []).map(async (record) => {
    const { data: signed } = await supabase.storage.from("certificates").createSignedUrl(record.pdf_url, 60 * 30);
    return { ...record, download_url: signed?.signedUrl ?? null };
  }));
  return NextResponse.json({ certificates });
}
