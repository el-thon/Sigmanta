import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIGMITA",
  description: "Platform WebGIS untuk pemetaan lahan, zona rawan bencana, dan titik mitigasi."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
