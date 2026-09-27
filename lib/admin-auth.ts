import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "ctf_admin_session";
const maxAge = 60 * 60 * 12;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("ADMIN_SESSION_SECRET is not configured.");
  return value;
}
function signature(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }

export function createAdminSession() {
  const expires = Math.floor(Date.now() / 1000) + maxAge;
  const payload = `admin.${expires}`;
  return `${payload}.${signature(payload)}`;
}
export async function isAdmin() {
  try {
    const value = (await cookies()).get(COOKIE)?.value;
    if (!value) return false;
    const [role, rawExpires, received] = value.split(".");
    if (role !== "admin" || !rawExpires || !received || Number(rawExpires) < Date.now() / 1000) return false;
    const payload = `${role}.${rawExpires}`;
    const expected = signature(payload);
    return received.length === expected.length && timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  } catch { return false; }
}
export function adminCookie(value: string) {
  return { name: COOKIE, value, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge };
}
export function requireConfiguredPasskey(passkey: string) {
  const expected = process.env.ADMIN_PASSKEY;
  if (!expected) throw new Error("ADMIN_PASSKEY is not configured.");
  const candidate = Buffer.from(passkey);
  const target = Buffer.from(expected);
  return candidate.length === target.length && timingSafeEqual(candidate, target);
}
