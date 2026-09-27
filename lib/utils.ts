import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const eventName = process.env.NEXT_PUBLIC_EVENT_NAME || "CTF Championship 2026";
export const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "organizers@example.org";
