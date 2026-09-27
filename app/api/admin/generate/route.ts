import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { generateCertificateImage } from "@/lib/certificate-image";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { CertificateType, ParticipantInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const participantSchema = z.object({ fullName: z.string().trim().min(2).max(140), rank: z.number().int().positive().max(100000).nullable().optional() });
const requestSchema = z.object({ records: z.array(participantSchema).min(1).max(10), autoDetectTop5: z.boolean().default(true), regenerate: z.boolean().default(false) });
function filenameFor(name: string) { const slug = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); return `${slug || "certificate"}.jpg`; }

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { records, autoDetectTop5, regenerate } = requestSchema.parse(await request.json());
    const names = records.map(({ fullName }) => fullName.trim());
    if (new Set(names.map((name) => name.toLocaleLowerCase())).size !== names.length) return NextResponse.json({ error: "Each full name must be unique so a unique JPG filename can be created." }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await supabase.from("certificates").select("full_name, file_name").in("full_name", names);
    if (lookupError) throw lookupError;
    const known = new Map((existing ?? []).map((item) => [item.full_name, item.file_name]));
    const processable = regenerate ? records : records.filter(({ fullName }) => !known.has(fullName.trim()));
    if (!processable.length) return NextResponse.json({ generated: [], skipped: names, message: "Every listed name already has a certificate image." });
    const generated: Array<{ fullName: string; fileName: string }> = [];
    for (const record of processable) {
      const participant: ParticipantInput = { fullName: record.fullName.trim(), rank: record.rank ?? null };
      const type: CertificateType = autoDetectTop5 && participant.rank && participant.rank <= 5 ? "TOP_5" : "PARTICIPANT";
      const fileName = known.get(participant.fullName) ?? filenameFor(participant.fullName);
      const jpg = await generateCertificateImage(participant, type);
      const { error: uploadError } = await supabase.storage.from("certificate-images").upload(fileName, jpg, { contentType: "image/jpeg", upsert: true, cacheControl: "3600" });
      if (uploadError) throw uploadError;
      const { error: saveError } = await supabase.from("certificates").upsert({ full_name: participant.fullName, certificate_type: type, rank: type === "TOP_5" ? participant.rank : null, image_url: fileName, file_name: fileName, issued_at: new Date().toISOString() }, { onConflict: "full_name" });
      if (saveError) throw saveError;
      generated.push({ fullName: participant.fullName, fileName });
    }
    return NextResponse.json({ generated, skipped: regenerate ? [] : names.filter((name) => known.has(name)) });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
