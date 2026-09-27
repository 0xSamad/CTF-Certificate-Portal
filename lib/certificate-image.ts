import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { CertificateType, ParticipantInput } from "./types";

function xml(value: string | number) {
  return String(value).replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!);
}
function fontSize(name: string) { return name.length > 28 ? 74 : name.length > 20 ? 90 : 110; }

/** Creates a JPG using the supplied Peshawar Pentesters certificate artwork. */
export async function generateCertificateImage(participant: ParticipantInput, type: CertificateType) {
  const topFive = type === "TOP_5";
  const background = path.join(process.cwd(), "public", "certificate-backgrounds", topFive ? "top-5.png" : "participation.png");
  const overlays = [
    `<svg width="1760" height="1360" xmlns="http://www.w3.org/2000/svg">
      <rect x="100" y="${topFive ? 570 : 650}" width="1560" height="${topFive ? 168 : 164}" fill="#e8e4d7"/>
      <text x="880" y="${topFive ? 700 : 780}" text-anchor="middle" font-family="DejaVu Serif, serif" font-weight="bold" font-size="${fontSize(participant.fullName)}" fill="#173d2f">${xml(participant.fullName)}</text>
    </svg>`,
  ];
  if (topFive) overlays.push(`<svg width="1760" height="1360" xmlns="http://www.w3.org/2000/svg">
    <rect x="475" y="758" width="810" height="84" fill="#f8e9bd" stroke="#bb9760" stroke-width="2"/>
    <text x="880" y="823" text-anchor="middle" font-family="DejaVu Serif, serif" font-weight="bold" font-size="54" fill="#996400">Rank #${xml(participant.rank ?? "")}</text>
  </svg>`);
  return sharp(await readFile(background)).composite(overlays.map((input) => ({ input: Buffer.from(input) }))).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer();
}
