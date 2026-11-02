import type { Metadata } from "next";
import "./globals.css";
import PwaInstall from "@/components/pwa-install";
export const metadata: Metadata = { title: "Bayit — Muchos hogares. Una vida compartida.", description: "Calendarios y organización familiar, con privacidad para cada hogar.", manifest: "/manifest.webmanifest", appleWebApp: { capable: true, statusBarStyle: "default", title: "Bayit" }, icons: { apple: "/icons/bayit-192.png" }, themeColor: "#F8F9FC" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="es"><body>{children}<div className="fixed bottom-4 right-4 z-50 rounded-full border border-bayit-line bg-white/95 px-3 py-2 shadow-soft"><PwaInstall/></div></body></html>; }
