"use client";

import { Download, Image as ImageIcon, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Certificate = { full_name: string; certificate_type: "PARTICIPANT" | "TOP_5"; rank: number | null; file_name: string; downloadUrl: string };

export function CertificateSearch() {
  const [certificates, setCertificates] = useState<Certificate[]>([]); const [query, setQuery] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/certificates/public").then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); setCertificates(body.certificates); }).catch((err) => setError(err instanceof Error ? err.message : "Unable to load certificates.")).finally(() => setLoading(false)); }, []);
  const shown = useMemo(() => certificates.filter((certificate) => certificate.full_name.toLowerCase().includes(query.trim().toLowerCase())), [certificates, query]);
  return <section className="panel mt-10 p-5 text-left sm:p-8"><div className="flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="name">Search by name</label><div className="relative flex-1"><Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" /><input id="name" value={query} onChange={(event) => setQuery(event.target.value)} className="field pl-10" placeholder="Search by full name" /></div></div>
    <p className="mt-4 text-sm text-slate-400">Public certificate gallery · {loading ? "Loading…" : `${shown.length} certificate${shown.length === 1 ? "" : "s"}`}</p>
    {error && <p role="alert" className="mt-4 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
    <div className="mt-6 grid gap-5 sm:grid-cols-2">{shown.map((certificate) => <article key={certificate.file_name} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950/40"><img className="aspect-[1.294] w-full object-cover" src={certificate.downloadUrl} alt={`${certificate.full_name}'s certificate`} /><div className="p-4"><h2 className="font-semibold">{certificate.full_name}</h2><p className="mt-1 text-sm text-slate-400">{certificate.certificate_type === "TOP_5" ? `Top 5 · Rank #${certificate.rank}` : "Participant"}</p><a className="button mt-4 w-full" href={certificate.downloadUrl} download={certificate.file_name}><Download className="mr-2 h-4 w-4" />Download JPG</a></div></article>)}</div>
    {!loading && !error && !shown.length && <div className="mt-6 rounded-xl border border-slate-700 p-8 text-center text-slate-400"><ImageIcon className="mx-auto mb-3 h-7 w-7" />No certificate matches that name.</div>}
  </section>;
}
