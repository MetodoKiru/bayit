"use client";
import {useEffect,useState} from "react";
type InstallEvent=Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
export default function PwaInstall(){
 const [installEvent,setInstallEvent]=useState<InstallEvent|null>(null);
 const [installed,setInstalled]=useState(false);
 const [ios,setIos]=useState(false);
 useEffect(()=>{
  const isStandalone=window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & {standalone?:boolean}).standalone===true;
  setInstalled(isStandalone);
  setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone);
  const handler=(event:Event)=>{event.preventDefault();setInstallEvent(event as InstallEvent)};
  window.addEventListener("beforeinstallprompt",handler);
  window.addEventListener("appinstalled",()=>setInstalled(true));
  if("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
  return ()=>window.removeEventListener("beforeinstallprompt",handler);
 },[]);
 async function install(){if(!installEvent)return;await installEvent.prompt();const choice=await installEvent.userChoice;if(choice.outcome==="accepted")setInstalled(true);setInstallEvent(null);}
 if(installed)return <p className="text-xs text-bayit-muted">Bayit está instalada en este dispositivo.</p>;
 if(installEvent)return <button onClick={install} className="rounded-full bg-bayit-brown px-4 py-2.5 text-xs text-white">Instalar Bayit</button>;
 if(ios)return <p className="max-w-xs text-right text-[11px] leading-4 text-bayit-muted">Para instalar: pulsa Compartir en Safari y después «Añadir a pantalla de inicio».</p>;
 return <p className="text-[11px] text-bayit-muted">Puedes añadir Bayit a tu pantalla de inicio desde el menú del navegador cuando esté disponible.</p>;
}