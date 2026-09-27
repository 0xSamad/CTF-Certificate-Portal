import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { certificateImageUrl, getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await getSupabaseAdmin().from("certificates").select("*").order("issued_at", { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ certificates: (data ?? []).map((record) => ({ ...record, download_url: certificateImageUrl(record.image_url) })) });
}
