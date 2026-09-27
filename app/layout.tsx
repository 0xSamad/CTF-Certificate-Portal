import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CTF Certificate Portal",
  description: "Verify and download your CTF certificate.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
