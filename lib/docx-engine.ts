import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { ParticipantInput } from "./types";

type TemplateKind = "participation" | "top5";

function escapeXml(value: string | number) {
  return String(value).replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!);
}

/**
 * Confirms either standard docxtemplater tags or the legacy markers used in
 * the supplied Peshawar Pentesters certificate designs.
 */
export function validateCertificateTemplate(template: ArrayBuffer, kind: TemplateKind) {
  const xml = new PizZip(Buffer.from(template)).file("word/document.xml")?.asText() ?? "";
  const hasName = xml.includes("{fullName}") || xml.includes("[STUDENT NAME]");
  const hasRank = xml.includes("{rank}") || xml.includes("[RANK]");
  if (!hasName) throw new Error("Template needs a {fullName} tag or a [STUDENT NAME] marker.");
  if (kind === "top5" && !hasRank) throw new Error("Top 5 template needs a {rank} tag or a [RANK] marker.");
}

/** Renders standard tags and the [STUDENT NAME]/[RANK] markers used by the supplied templates. */
export function populateDocx(template: ArrayBuffer, participant: ParticipantInput, date: string) {
  const zip = new PizZip(Buffer.from(template));
  // These markers each occupy their own Word text run in the supplied DOCX
  // certificates, preserving their original typography after replacement.
  const documentXml = zip.file("word/document.xml")?.asText();
  if (documentXml) {
    zip.file("word/document.xml", documentXml
      .replaceAll("[STUDENT NAME]", escapeXml(participant.fullName))
      .replaceAll("[RANK]", escapeXml(participant.rank ?? "")));
  }
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render({ fullName: participant.fullName, email: participant.email, rank: participant.rank ?? "", date });
  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
