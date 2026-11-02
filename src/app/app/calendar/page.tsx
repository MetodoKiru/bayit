"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BAYIT_PALETTE } from "@/lib/calendar-palette";

const demoPeople=[{name:"Mi calendario",color:BAYIT_PALETTE[0].value},{name:"Hogar",color:BAYIT_PALETTE[5].value},{name:"Mamá",color:BAYIT_PALETTE[2].value},{name:"Hermano",color:BAYIT_PALETTE[1].value}];

export default function CalendarPage(){
  const [view,setView]=useState<"month"|"week">("month");
  const [date,setDate]=useState(()=>new Date());
  const [showPeople,setShowPeople]=useState(true);
  const year=date.getFullYear(),month=date.getMonth();
  const days=useMemo(()=>{const first=new Date(year,month,1);const start=(first.getDay()+6)%7;const count=new Date(year,month+1,0).getDate();return [...Array(start).fill(null),...Array.from({length:count},(_,i)=>i+1)];},[year,month]);
  const label=new Intl.DateTimeFormat("es-ES",{month:"long",year:"numeric"}).format(date);
  const move=(n:number)=>setDate(new Date(year,month+n,1));
  return <main className="min-h-screen bg-bayit-cream px-5 py-7 sm:px-10"><div className="mx-auto max-w-6xl">
    <header className="flex items-center justify-between"><Link href="/app" className="text-2xl font-semibold text-bayit-brown">bayit</Link><Link href="/app" className="rounded-full border border-bayit-line bg-white px-4 py-2 text-xs text-bayit-muted">← Mi espacio</Link></header>
    <div className="mt-12 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[.2em] text-bayit-olive">Organiza tu tiempo</p><h1 className="mt-2 text-4xl font-medium capitalize">{label}</h1><p className="mt-2 text-sm text-bayit-muted">Una vista conjunta, con un color para cada hogar y persona.</p></div><div className="flex rounded-full border border-bayit-line bg-white p-1"><button onClick={()=>setView("month")} className={`rounded-full px-4 py-2 text-xs ${view==="month"?"bg-bayit-brown text-white":"text-bayit-muted"}`}>Mes</button><button onClick={()=>setView("week")} className={`rounded-full px-4 py-2 text-xs ${view==="week"?"bg-bayit-brown text-white":"text-bayit-muted"}`}>Semana</button></div></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
      <section className="rounded-[2rem] border border-bayit-line bg-white p-5 shadow-soft sm:p-8">
        <div className="mb-6 flex items-center justify-between"><div className="flex gap-2"><button onClick={()=>move(-1)} aria-label="Mes anterior" className="grid h-9 w-9 place-items-center rounded-full border border-bayit-line">‹</button><button onClick={()=>setDate(new Date())} className="rounded-full border border-bayit-line px-4 text-xs">Hoy</button><button onClick={()=>move(1)} aria-label="Mes siguiente" className="grid h-9 w-9 place-items-center rounded-full border border-bayit-line">›</button></div><span className="text-xs text-bayit-muted">{view==="month"?"Vista mensual":"Vista semanal"}</span></div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-bayit-muted">{["L","M","X","J","V","S","D"].map(d=><span key={d} className="py-2">{d}</span>)}</div>
        <div className="grid grid-cols-7 gap-1">{(view==="month"?days:days.slice(0,7)).map((day,i)=><div key={i} className={`min-h-16 rounded-xl p-2 sm:min-h-24 ${day===new Date().getDate()&&month===new Date().getMonth()&&year===new Date().getFullYear()?"bg-[#F2F5FB] ring-1 ring-bayit-sky":"bg-[#FAFBFD]"}`}>{day&&<><span className="text-xs text-bayit-muted">{day}</span>{showPeople&&day%5===0&&<div className="mt-2 flex gap-1"><i className="h-2 w-2 rounded-full" style={{background:demoPeople[1].color}}/><i className="h-2 w-2 rounded-full" style={{background:demoPeople[2].color}}/></div>}</>}</div>)}</div>
        <div className="mt-5 rounded-2xl bg-bayit-cream p-4 text-sm text-bayit-muted">Tu calendario aparecerá aquí cuando hayas creado tu hogar y añadido compromisos. Los puntos de color son solo una muestra visual.</div>
      </section>
      <aside className="rounded-[2rem] border border-bayit-line bg-white p-6"><h2 className="text-lg font-semibold">Mis calendarios</h2><p className="mt-1 text-xs text-bayit-muted">Activa los que quieras visualizar.</p><div className="mt-5 space-y-3">{demoPeople.map(p=><label key={p.name} className="flex items-center gap-3 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4 accent-[#8796B5]"/><span className="h-3 w-3 rounded-full" style={{background:p.color}}/>{p.name}</label>)}</div><button onClick={()=>setShowPeople(!showPeople)} className="mt-7 w-full rounded-full border border-bayit-line px-4 py-2.5 text-xs">{showPeople?"Ocultar":"Mostrar"} indicadores de color</button><Link href="/app/planning" className="mt-3 block rounded-full bg-bayit-brown px-4 py-3 text-center text-xs text-white">Preparar mi mes</Link></aside>
    </div><p className="mt-6 text-center text-xs text-bayit-muted">Versión de interfaz: los eventos y filtros todavía no están conectados a la base de datos.</p>
  </div></main>;
}
