import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLogin } from "@/components/admin/admin-login";
import { isAdmin } from "@/lib/admin-auth";

export default async function AdminPage() {
  return <main className="min-h-screen bg-slate-950 px-5 py-10"><div className="mx-auto max-w-6xl">{await isAdmin() ? <AdminDashboard /> : <AdminLogin />}</div></main>;
}
