import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { generateCertificatePdf } from "@/lib/certificate-pdf";
import { populateDocx } from "@/lib/docx-engine";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { CertificateType, ParticipantInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const participantSchema = z.object({
  fullName: z.string().trim().min(2).max(140),
  email: z.string().trim().email().max(255),
  rank: z.number().int().positive().max(100000).nullable().optional(),
});
const requestSchema = z.object({
  records: z.array(participantSchema).min(1).max(10),
  autoDetectTop5: z.boolean().default(true),
  regenerate: z.boolean().default(false),
});

const templatePath = { PARTICIPANT: "participation-template.docx", TOP_5: "top-5-template.docx" } as const;
const prettyDate = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" });

async function loadTemplate(type: CertificateType) {
  const { data, error } = await getSupabaseAdmin().storage.from("certificate-templates").download(templatePath[type]);
  if (error || !data) throw new Error(`Missing ${type === "TOP_5" ? "Top 5" : "participation"} .docx template. Upload it before generating.`);
  return data.arrayBuffer();
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { records, autoDetectTop5, regenerate } = requestSchema.parse(await request.json());
    const normalized = records.map((record) => ({ ...record, email: record.email.toLowerCase() }));
    const emails = normalized.map(({ email }) => email);
    if (new Set(emails).size !== emails.length) return NextResponse.json({ error: "This batch includes duplicate email addresses." }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await supabase.from("certificates").select("email").in("email", emails);
    if (lookupError) throw lookupError;
    const existingEmails = new Set((existing ?? []).map(({ email }) => email));
    const processable = regenerate ? normalized : normalized.filter(({ email }) => !existingEmails.has(email));
    if (!processable.length) return NextResponse.json({ generated: [], skipped: emails, message: "All addresses already have certificates." });

    const types = processable.map((p) => autoDetectTop5 && p.rank && p.rank <= 5 ? "TOP_5" as const : "PARTICIPANT" as const);
    const required = [...new Set(types)];
    const templateEntries = await Promise.all(required.map(async (type) => [type, await loadTemplate(type)] as const));
    const templates = new Map(templateEntries);
    const issuedAt = new Date();
    const date = prettyDate.format(issuedAt);
    const generated: Array<{ email: string; fullName: string }> = [];

    // At most 10 certificates per invocation: the browser queue starts the next chunk,
    // keeping this comfortably inside Vercel function time limits.
    for (let index = 0; index < processable.length; index++) {
      const participant: ParticipantInput = processable[index];
      const type = types[index];
      populateDocx(templates.get(type)!, participant, date); // verifies and renders DOCX placeholders
      const pdf = await generateCertificatePdf(participant, type, date);
      const objectPath = `${participant.email.replace(/[^a-z0-9]/gi, "_")}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage.from("certificates").upload(objectPath, pdf, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw uploadError;
      const { error: saveError } = await supabase.from("certificates").upsert({
        full_name: participant.fullName, email: participant.email, certificate_type: type,
        rank: type === "TOP_5" ? participant.rank : null, pdf_url: objectPath, issued_at: issuedAt.toISOString(),
      }, { onConflict: "email" });
      if (saveError) throw saveError;
      generated.push({ email: participant.email, fullName: participant.fullName });
    }
    return NextResponse.json({ generated, skipped: regenerate ? [] : [...existingEmails] });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
