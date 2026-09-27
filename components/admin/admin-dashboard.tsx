"use client";

import * as XLSX from "xlsx";
import { Download, FileSpreadsheet, LogOut, RefreshCw, Upload } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { ParticipantInput } from "@/lib/types";

type RecordRow = Record<string, unknown>;
type Certificate = { id: string; full_name: string; email: string; certificate_type: "PARTICIPANT" | "TOP_5"; rank: number | null; issued_at: string; download_url: string | null };
type Mapping = { fullName: string; email: string; rank: string };

function choice(headers: string[], candidates: string[]) { return headers.find((header) => candidates.includes(header.toLowerCase().trim())) ?? ""; }
function downloadCsv(certificates: Certificate[]) {
  const header = ["Full Name", "Email", "Type", "Rank", "Issued At", "Download URL"];
  const rows = certificates.map((c) => [c.full_name, c.email, c.certificate_type, c.rank ?? "", c.issued_at, c.download_url ?? ""]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "certificate-download-links.csv"; link.click(); URL.revokeObjectURL(link.href);
}

export function AdminDashboard() {
  const [rows, setRows] = useState<RecordRow[]>([]); const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({ fullName: "", email: "", rank: "" });
  const [autoDetectTop5, setAutoDetectTop5] = useState(true); const [regenerate, setRegenerate] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null); const [message, setMessage] = useState("");
  const [certificates, setCertificates] = useState<Certificate[]>([]); const [loadingTable, setLoadingTable] = useState(true);
  const [uploading, setUploading] = useState<"participation" | "top5" | null>(null);
  const participants = useMemo(() => rows.map((row) => ({
    fullName: String(row[mapping.fullName] ?? "").trim(), email: String(row[mapping.email] ?? "").trim(),
    rank: mapping.rank && row[mapping.rank] !== "" && row[mapping.rank] != null ? Number(row[mapping.rank]) : null,
  })), [rows, mapping]);
  const validCount = participants.filter((p) => p.fullName && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) && (p.rank === null || Number.isInteger(p.rank) && p.rank > 0)).length;

  async function refreshCertificates() { setLoadingTable(true); try { const r = await fetch("/api/admin/certificates"); const body = await r.json(); if (r.ok) setCertificates(body.certificates); } finally { setLoadingTable(false); } }
  useEffect(() => { refreshCertificates(); }, []);
  function readSpreadsheet(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => { try { const workbook = XLSX.read(reader.result, { type: "array" }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; const parsed = XLSX.utils.sheet_to_json<RecordRow>(sheet, { defval: "" }); const h = parsed.length ? Object.keys(parsed[0]) : [];
      setRows(parsed); setHeaders(h); setMapping({ fullName: choice(h, ["full name", "fullname", "name"]), email: choice(h, ["email", "email address", "e-mail"]), rank: choice(h, ["rank", "position", "place"]) }); setMessage("");
    } catch { setMessage("That spreadsheet could not be read. Upload a CSV, XLSX, or XLS file."); } }; reader.readAsArrayBuffer(file);
  }
  async function uploadTemplate(kind: "participation" | "top5", event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; setUploading(kind); setMessage(""); const form = new FormData(); form.append("kind", kind); form.append("file", file); const response = await fetch("/api/admin/templates", { method: "POST", body: form }); const body = await response.json(); setUploading(null); setMessage(response.ok ? `${kind === "top5" ? "Top 5" : "Participation"} template saved.` : body.error || "Template upload failed."); event.target.value = ""; }
  async function issue(input: ParticipantInput[], override = regenerate) {
    const response = await fetch("/api/admin/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: input, autoDetectTop5, regenerate: override }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Generation failed."); return body;
  }
  async function generateAll() {
    const invalid = participants.length - validCount; if (!participants.length) return setMessage("Upload a participant spreadsheet first."); if (invalid) return setMessage(`${invalid} row(s) have invalid names, email addresses, or ranks. Correct the mapping/data first.`);
    const emails = participants.map((p) => p.email.toLowerCase()); if (new Set(emails).size !== emails.length) return setMessage("The uploaded data has duplicate email addresses.");
    setMessage(""); setProgress({ current: 0, total: participants.length }); let complete = 0;
    try { for (let i = 0; i < participants.length; i += 10) { const batch = participants.slice(i, i + 10); await issue(batch); complete += batch.length; setProgress({ current: complete, total: participants.length }); } setMessage(`Finished issuing ${participants.length} certificate(s).`); await refreshCertificates(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Generation failed."); } finally { setProgress(null); }
  }
  async function regenerateOne(certificate: Certificate) { setMessage(""); try { await issue([{ fullName: certificate.full_name, email: certificate.email, rank: certificate.rank }], true); setMessage(`Regenerated ${certificate.full_name}'s certificate.`); await refreshCertificates(); } catch (error) { setMessage(error instanceof Error ? error.message : "Regeneration failed."); } }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); window.location.reload(); }
  return <div>
    <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-medium text-cyan-300">CTF OPERATIONS</p><h1 className="mt-1 text-3xl font-bold">Certificate control room</h1></div><button className="button-muted" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign out</button></header>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="panel p-6"><h2 className="text-lg font-semibold">1. Upload templates</h2><p className="mt-1 text-sm text-slate-400">DOCX tags supported: <code>{"{fullName}"}</code>, <code>{"{email}"}</code>, <code>{"{rank}"}</code>, <code>{"{date}"}</code>.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{([ ["participation", "Participation template"], ["top5", "Top 5 template"] ] as const).map(([kind, label]) => <label key={kind} className="cursor-pointer rounded-xl border border-dashed border-slate-600 p-4 hover:border-cyan-400"><Upload className="h-5 w-5 text-cyan-300" /><span className="mt-2 block text-sm font-medium">{uploading === kind ? "Uploading…" : label}</span><span className="mt-1 block text-xs text-slate-500">.docx only</span><input className="sr-only" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={Boolean(uploading)} onChange={(e) => uploadTemplate(kind, e)} /></label>)}</div></section>
      <section className="panel p-6"><h2 className="text-lg font-semibold">2. Import participants</h2><p className="mt-1 text-sm text-slate-400">Choose a CSV or Excel spreadsheet. Nothing is issued until you confirm below.</p><label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 p-7 text-sm text-slate-300 hover:border-cyan-400"><FileSpreadsheet className="h-5 w-5 text-cyan-300" />Upload spreadsheet<input className="sr-only" type="file" accept=".csv,.xlsx,.xls" onChange={readSpreadsheet} /></label>{rows.length > 0 && <p className="mt-3 text-sm text-emerald-300">Loaded {rows.length} row(s); {validCount} currently valid.</p>}</section>
    </div>
    {headers.length > 0 && <section className="panel mt-6 p-6"><h2 className="text-lg font-semibold">3. Confirm column mapping</h2><div className="mt-4 grid gap-4 sm:grid-cols-3">{([ ["fullName", "Full name"], ["email", "Email"], ["rank", "Rank (optional)"] ] as const).map(([field, label]) => <label key={field} className="text-sm text-slate-300">{label}<select className="field mt-1" value={mapping[field]} onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}><option value="">{field === "rank" ? "No rank column" : "Select column"}</option>{headers.map((header) => <option key={header} value={header}>{header}</option>)}</select></label>)}</div><div className="mt-5 flex flex-wrap items-center gap-5"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoDetectTop5} onChange={(e) => setAutoDetectTop5(e.target.checked)} />Use Top 5 template for ranks 1–5</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={regenerate} onChange={(e) => setRegenerate(e.target.checked)} />Overwrite existing certificates</label><button className="button" disabled={progress !== null} onClick={generateAll}>{progress ? "Processing…" : "Generate certificates"}</button></div>{progress && <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-slate-400"><span>Issuing certificates</span><span>{progress.current}/{progress.total}</span></div><div className="h-2 overflow-hidden rounded bg-slate-700"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress.current / progress.total * 100}%` }} /></div></div>}</section>}
    {message && <p role="status" className="mt-5 rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-200">{message}</p>}
    <section className="panel mt-6 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 p-6"><div><h2 className="text-lg font-semibold">Issued certificates</h2><p className="mt-1 text-sm text-slate-400">Most recent 200 records</p></div><div className="flex gap-2"><button className="button-muted" onClick={refreshCertificates}><RefreshCw className="mr-2 h-4 w-4" />Refresh</button><button className="button-muted" disabled={!certificates.length} onClick={() => downloadCsv(certificates)}><Download className="mr-2 h-4 w-4" />Export links</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-y border-slate-700 bg-slate-900/80 text-slate-400"><tr><th className="p-4">Participant</th><th className="p-4">Achievement</th><th className="p-4">Issued</th><th className="p-4">Actions</th></tr></thead><tbody>{loadingTable ? <tr><td className="p-5 text-slate-400" colSpan={4}>Loading…</td></tr> : certificates.length ? certificates.map((c) => <tr key={c.id} className="border-b border-slate-800"><td className="p-4"><div className="font-medium">{c.full_name}</div><div className="text-slate-500">{c.email}</div></td><td className="p-4">{c.certificate_type === "TOP_5" ? `Top 5 · #${c.rank}` : "Participant"}</td><td className="p-4 text-slate-400">{new Date(c.issued_at).toLocaleDateString()}</td><td className="p-4"><div className="flex gap-2">{c.download_url && <a className="button-muted !px-3 !py-2" href={c.download_url} target="_blank" rel="noreferrer">PDF</a>}<button className="button-muted !px-3 !py-2" onClick={() => regenerateOne(c)}>Regenerate</button></div></td></tr>) : <tr><td className="p-5 text-slate-400" colSpan={4}>No certificates issued yet.</td></tr>}</tbody></table></div></section>
  </div>;
}
