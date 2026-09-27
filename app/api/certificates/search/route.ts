import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const emailSchema = z.string().trim().email().max(255);

export async function GET(request: Request) {
  const email = emailSchema.safeParse(new URL(request.url).searchParams.get("email"));
  if (!email.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("certificates")
    .select("full_name, email, certificate_type, rank, pdf_url, issued_at").eq("email", email.data.toLowerCase()).maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to look up the certificate." }, { status: 500 });
  if (!data) return NextResponse.json({ found: false });
  const { data: signed, error: signedError } = await supabase.storage.from("certificates").createSignedUrl(data.pdf_url, 60 * 30);
  if (signedError || !signed) return NextResponse.json({ error: "Certificate file is currently unavailable." }, { status: 500 });
  return NextResponse.json({ found: true, certificate: { ...data, downloadUrl: signed.signedUrl } });
}
