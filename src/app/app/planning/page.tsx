"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

const categories=["Exámenes","Entregas y trabajos","Estudio","Planes con amigos","Fiestas y celebraciones","Viajes","Citas y gestiones","Deporte","Salud","Compromisos familiares","Otros"];
type Entry={id:string;category:string;title:string;date:string;time:string;endTime:string;allDay:boolean;notes:string};
const empty=():Entry=>({id:crypto.randomUUID(),category:"Estudio",title:"",date:"",time:"",endTime:"",allDay:false,notes:""});

export default function PlanningPage(){
 const [entries,setEntries]=useState<Entry[]>([]);
 const [busyDays,setBusyDays]=useState("");
 const [preferences,setPreferences]=useState("");
 const [availability,setAvailability]=useState("normal");
 const [saved,setSaved]=useState(false);
 useEffect(()=>{try{const raw=localStorage.getItem("bayit-monthly-planning-draft");if(raw){const d=JSON.parse(raw);setEntries(d.entries??[]);setBusyDays(d.busyDays??"");setPreferences(d.preferences??"");setAvailability(d.availability??"normal");}}catch{}},[]);
 function update(id:string,patch:Partial<Entry>){setEntries(es=>es.map(e=>e.id===id?{...e,...patch}:e));setSaved(false);}
 function saveDraft(){localStorage.setItem("bayit-monthly-planning-draft",JSON.stringify({entries,busyDays,preferences,availability}));setSaved(true);}
 function submit(e:FormEvent){e.preventDefault();saveDraft();}
 return <main className="min-h-screen bg-bayit-cream px-5 py-7 sm:px-10"><div className="mx-auto max-w-4xl">
  <header className="flex items-center justify-between"><Link href="/app" className="text-2xl font-semibold text-bayit-brown">bayit</Link><Link href="/app" className="rounded-full border border-bayit-line bg-white px-4 py-2 text-xs text-bayit-muted">← Mi espacio</Link></header>
  <section className="mt-12"><p className="text-xs font-semibold uppercase tracking-[.2em] text-bayit-olive">Planificación mensual</p><h1 className="mt-2 text-4xl font-medium">Prepara tu próximo mes.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-bayit-muted">Cuéntanos qué tienes previsto. Así podremos coordinar calendarios y proponer planes sin duplicar información.</p></section>
  <form onSubmit={submit} className="mt-8 space-y-6">
   <section className="rounded-[2rem] border border-bayit-line bg-white p-6 sm:p-8"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Tus compromisos</h2><p className="mt-1 text-xs text-bayit-muted">Añade los eventos que ya conoces.</p></div><span className="rounded-full bg-bayit-cream px-3 py-1 text-xs text-bayit-muted">{entries.length}</span></div>
    {entries.map((entry,i)=><div key={entry.id} className="mt-5 rounded-2xl border border-bayit-line p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-bayit-olive">COMPROMISO {i+1}</p><button type="button" onClick={()=>setEntries(es=>es.filter(e=>e.id!==entry.id))} className="text-xs text-bayit-muted underline">Eliminar</button></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs text-bayit-muted">Tipo<select value={entry.category} onChange={e=>update(entry.id,{category:e.target.value})} className="mt-1 w-full rounded-xl border border-bayit-line bg-white px-3 py-3 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className="text-xs text-bayit-muted">Nombre<input value={entry.title} onChange={e=>update(entry.id,{title:e.target.value})} placeholder="Ej. Examen de economía" className="mt-1 w-full rounded-xl border border-bayit-line px-3 py-3 text-sm"/></label><label className="text-xs text-bayit-muted">Fecha<input type="date" value={entry.date} onChange={e=>update(entry.id,{date:e.target.value})} className="mt-1 w-full rounded-xl border border-bayit-line px-3 py-3 text-sm"/></label><label className="flex items-center gap-2 self-end pb-3 text-xs text-bayit-muted"><input type="checkbox" checked={entry.allDay} onChange={e=>update(entry.id,{allDay:e.target.checked})}/> Todo el día</label>{!entry.allDay&&<><label className="text-xs text-bayit-muted">Desde<input type="time" value={entry.time} onChange={e=>update(entry.id,{time:e.target.value})} className="mt-1 w-full rounded-xl border border-bayit-line px-3 py-3 text-sm"/></label><label className="text-xs text-bayit-muted">Hasta<input type="time" value={entry.endTime} onChange={e=>update(entry.id,{endTime:e.target.value})} className="mt-1 w-full rounded-xl border border-bayit-line px-3 py-3 text-sm"/></label></>}</div><label className="mt-3 block text-xs text-bayit-muted">Notas o flexibilidad<input value={entry.notes} onChange={e=>update(entry.id,{notes:e.target.value})} placeholder="Ej. puedo cambiarlo al jueves" className="mt-1 w-full rounded-xl border border-bayit-line px-3 py-3 text-sm"/></label>
    </div>)}
    <button type="button" onClick={()=>setEntries(es=>[...es,empty()])} className="mt-5 rounded-full border border-bayit-line px-5 py-3 text-xs font-medium">+ Añadir compromiso</button>
   </section>
   <section className="rounded-[2rem] border border-bayit-line bg-white p-6 sm:p-8"><h2 className="text-lg font-semibold">Disponibilidad general</h2><p className="mt-1 text-xs text-bayit-muted">¿Cómo suele ser tu mes?</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{[{v:"normal",t:"Bastante normal",d:"Mi rutina habitual."},{v:"busy",t:"Bastante ocupado",d:"Tengo poco margen."},{v:"flexible",t:"Muy flexible",d:"Puedo organizar planes."}].map(o=><button type="button" key={o.v} onClick={()=>setAvailability(o.v)} className={`rounded-2xl border p-4 text-left ${availability===o.v?"border-bayit-sky bg-[#F5F8FC]":"border-bayit-line"}`}><span className="block text-sm font-medium">{o.t}</span><span className="mt-1 block text-xs text-bayit-muted">{o.d}</span></button>)}</div>
    <label className="mt-5 block text-xs text-bayit-muted">Días o franjas en los que sabes que no estarás disponible<textarea value={busyDays} onChange={e=>setBusyDays(e.target.value)} rows={3} placeholder="Ej. todos los martes por la tarde, del 14 al 18 estaré de viaje…" className="mt-2 w-full rounded-xl border border-bayit-line px-4 py-3 text-sm"/></label>
    <label className="mt-5 block text-xs text-bayit-muted">Preferencias y objetivos del mes<textarea value={preferences} onChange={e=>setPreferences(e.target.value)} rows={3} placeholder="Ej. prefiero reservar los domingos para descansar; me gustaría organizar una comida familiar…" className="mt-2 w-full rounded-xl border border-bayit-line px-4 py-3 text-sm"/></label>
   </section>
   <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-md text-xs leading-5 text-bayit-muted">Por ahora este formulario guarda un borrador en este dispositivo. Todavía no envía ni comparte información con otros hogares.</p><button className="rounded-full bg-bayit-brown px-7 py-3.5 text-sm text-white">Guardar borrador</button></div>
   {saved&&<p role="status" className="rounded-xl bg-white p-4 text-sm text-bayit-olive">Borrador guardado en este dispositivo.</p>}
  </form>
 </div></main>;
}
