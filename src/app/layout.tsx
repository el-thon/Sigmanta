import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
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
