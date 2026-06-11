import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIGMANTA",
  description: "Platform WebGIS untuk pemetaan lahan, zona rawan bencana, dan titik mitigasi."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
