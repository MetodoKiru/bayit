"use client";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaInstall() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  }

  if (installed) {
    return <span className="text-xs text-bayit-muted">Bayit instalada</span>;
  }

  return (
    <div className="flex max-w-[min(92vw,340px)] items-center gap-2">
      {promptEvent ? (
        <button onClick={install} className="rounded-full bg-bayit-brown px-4 py-2.5 text-xs font-medium text-white shadow-soft">
          Instalar Bayit
        </button>
      ) : (
        <button onClick={() => setHelpOpen(value => !value)} className="rounded-full bg-bayit-brown px-4 py-2.5 text-xs font-medium text-white shadow-soft">
          {ios ? "Cómo instalar Bayit" : "Añadir Bayit"}
        </button>
      )}
      {helpOpen && (
        <div className="absolute bottom-14 right-0 w-[min(88vw,320px)] rounded-2xl border border-bayit-line bg-white p-4 text-xs leading-5 text-bayit-brown shadow-soft">
          {ios
            ? <>En tu iPhone: abre esta página en <strong>Safari</strong>, pulsa <strong>Compartir</strong> y elige <strong>Añadir a pantalla de inicio</strong>.</>
            : <>Abre el menú de tu navegador y selecciona <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>. Si no aparece, prueba desde Chrome.</>}
        </div>
      )}
    </div>
  );
}
