import { NextResponse } from "next/server";
import { certificateImageUrl, getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const { data, error } = await getSupabaseAdmin().from("certificates").select("full_name, certificate_type, rank, image_url, file_name, issued_at").order("full_name").limit(1000);
  if (error) return NextResponse.json({ error: "Unable to load certificates." }, { status: 500 });
  return NextResponse.json({ certificates: (data ?? []).map((record) => ({ ...record, downloadUrl: certificateImageUrl(record.image_url) })) });
}
