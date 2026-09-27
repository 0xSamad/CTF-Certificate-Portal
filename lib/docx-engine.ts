import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { ParticipantInput } from "./types";

/** Renders standard docxtemplater tags: {fullName}, {email}, {rank}, {date}. */
export function populateDocx(template: ArrayBuffer, participant: ParticipantInput, date: string) {
  const zip = new PizZip(Buffer.from(template));
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render({ fullName: participant.fullName, email: participant.email, rank: participant.rank ?? "", date });
  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
