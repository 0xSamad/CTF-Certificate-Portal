import { CertificateSearch } from "@/components/user/certificate-search";
import { eventName } from "@/lib/utils";

export default function Home() {
  return <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#12365a,_#08111f_58%)] px-5 py-12 sm:py-20">
    <div className="mx-auto max-w-2xl text-center">
      <div className="mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-sm text-cyan-200">Certificate verification portal</div>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{eventName}</h1>
      <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-300">Find your official CTF certificate with the email address used for registration.</p>
      <CertificateSearch />
    </div>
  </main>;
}
