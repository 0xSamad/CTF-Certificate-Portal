"use client";

import { Download, Search, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { supportEmail } from "@/lib/utils";

type Certificate = { full_name: string; email: string; certificate_type: "PARTICIPANT" | "TOP_5"; rank: number | null; issued_at: string; downloadUrl: string };

export function CertificateSearch() {
  const [email, setEmail] = useState(""); const [result, setResult] = useState<Certificate | null>(null);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function search(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch(`/api/certificates/search?email=${encodeURIComponent(email)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      if (!body.found) throw new Error(`We couldn't find a certificate for that email. Contact ${supportEmail} if you think this is a mistake.`);
      setResult(body.certificate);
    } catch (err) { setError(err instanceof Error ? err.message : "Search failed."); } finally { setLoading(false); }
  }
  return <section className="panel mt-10 p-5 text-left sm:p-8">
    <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="email">Registration email</label>
      <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="you@example.com" />
      <button className="button shrink-0" disabled={loading}>{loading ? "Verifying…" : <><Search className="mr-2 h-4 w-4" />Find certificate</>}</button>
    </form>
    {error && <p role="alert" className="mt-4 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
    {result && <div className="mt-6 overflow-hidden rounded-xl border border-emerald-400/30 bg-emerald-950/20">
      <div className="flex gap-3 p-5"><ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-emerald-300" /><div><p className="text-sm text-emerald-200">Verified certificate</p><h2 className="mt-1 text-xl font-bold">{result.full_name}</h2><p className="mt-1 text-slate-300">{result.certificate_type === "TOP_5" ? `Top 5 Winner · Rank #${result.rank}` : "Participant"}</p></div></div>
      <div className="border-t border-emerald-400/20 bg-slate-950/30 p-4"><iframe className="mb-4 h-[300px] w-full rounded-lg bg-white sm:h-[420px]" title="Certificate PDF preview" src={`${result.downloadUrl}#view=FitH`} /><a className="button w-full sm:w-auto" href={result.downloadUrl} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" />Download certificate (PDF)</a></div>
    </div>}
  </section>;
}
