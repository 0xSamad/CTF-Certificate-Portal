"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";

export function AdminLogin() {
  const [passkey, setPasskey] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passkey }) });
    if (response.ok) window.location.reload(); else setError((await response.json()).error || "Unable to sign in."); setLoading(false);
  }
  return <section className="panel mx-auto max-w-md p-7"><LockKeyhole className="h-8 w-8 text-cyan-300" /><h1 className="mt-4 text-2xl font-bold">Administrator access</h1><p className="mt-2 text-sm text-slate-400">Enter the event passkey to manage certificate issuance.</p>
    <form className="mt-6 space-y-4" onSubmit={submit}><input className="field" type="password" autoFocus required value={passkey} onChange={(e) => setPasskey(e.target.value)} placeholder="Admin passkey" /><button className="button w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>{error && <p className="text-sm text-rose-300">{error}</p>}</form>
  </section>;
}
