import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Bayit — Muchos hogares. Una vida compartida.", description: "Calendarios y organización familiar, con privacidad para cada hogar." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="es"><body>{children}</body></html>; }
