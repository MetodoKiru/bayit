"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Participant = { id: string; name: string; household: string };
const kinds = ["Comida", "Cena", "Celebración", "Visita", "Viaje", "Actividad", "Otro"];

export default function OrganizePage() {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("Comida");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [duration, setDuration] = useState("2");
  const [buffer, setBuffer] = useState("30");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [personName, setPersonName] = useState("");
  const [household, setHousehold] = useState("");
  const [constraints, setConstraints] = useState("");
  const [preferredDays, setPreferredDays] = useState("Cualquiera");
  const [prepared, setPrepared] = useState(false);

  function addParticipant(e: FormEvent) {
    e.preventDefault();
    if (!personName.trim() || !household.trim()) return;
    setParticipants((current) => [...current, { id: crypto.randomUUID(), name: personName.trim(), household: household.trim() }]);
    setPersonName("");
    setPrepared(false);
  }

  function prepare(e: FormEvent) {
    e.preventDefault();
    const draft = {
      id: crypto.randomUUID(), title, kind, from, to, durationHours: Number(duration),
      bufferMinutes: Number(buffer), participants, constraints, preferredDays,
      status: "draft", createdAt: new Date().toISOString(),
      note: "Borrador local: no se ha consultado disponibilidad ni enviado invitaciones."
    };
    localStorage.setItem("bayit-event-search-draft", JSON.stringify(draft));
    setPrepared(true);
  }

  return (
    <main className="min-h-screen bg-bayit-cream px-5 py-7 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between"><Link href="/app" className="text-2xl font-semibold text-bayit-brown">bayit</Link><Link href="/app" className="rounded-full border border-bayit-line bg-white px-4 py-2 text-xs">← Mi espacio</Link></header>
        <section className="mt-12"><p className="text-xs uppercase tracking-widest text-bayit-olive">Planificador compartido</p><h1 className="mt-2 text-4xl font-medium">Busquemos un buen momento.</h1><p className="mt-3 text-sm leading-7 text-bayit-muted">Define el plan, quién quieres invitar y qué condiciones debería respetar Bayit.</p></section>
        <form onSubmit={prepare} className="mt-8 space-y-5">
          <section className="rounded-3xl border border-bayit-line bg-white p-6">
            <h2 className="text-lg font-semibold">El plan</h2>
            <label className="mt-4 block text-xs">Nombre<input required value={title} onChange={e=>{setTitle(e.target.value);setPrepared(false)}} placeholder="Ej. Comida de cumpleaños" className="mt-2 w-full rounded-xl border border-bayit-line p-3 text-sm"/></label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs">Tipo<select value={kind} onChange={e=>setKind(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white p-3 text-sm">{kinds.map(k=><option key={k}>{k}</option>)}</select></label>
              <label className="text-xs">Duración<select value={duration} onChange={e=>setDuration(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white p-3 text-sm">{[1,1.5,2,3,4,6,8].map(v=><option key={v} value={v}>{v} {v===1?"hora":"horas"}</option>)}</select></label>
              <label className="text-xs">Primera fecha posible<input required type="date" value={from} onChange={e=>{setFrom(e.target.value);setPrepared(false)}} className="mt-2 w-full rounded-xl border border-bayit-line p-3 text-sm"/></label>
              <label className="text-xs">Última fecha posible<input required type="date" min={from} value={to} onChange={e=>{setTo(e.target.value);setPrepared(false)}} className="mt-2 w-full rounded-xl border border-bayit-line p-3 text-sm"/></label>
              <label className="text-xs">Margen antes y después<select value={buffer} onChange={e=>setBuffer(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white p-3 text-sm"><option value="0">Sin margen</option><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="60">1 hora</option><option value="120">2 horas</option></select></label>
              <label className="text-xs">Preferencia<select value={preferredDays} onChange={e=>setPreferredDays(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white p-3 text-sm">{["Cualquiera","Entre semana","Fin de semana","Viernes","Sábado","Domingo"].map(v=><option key={v}>{v}</option>)}</select></label>
            </div>
          </section>
          <section className="rounded-3xl border border-bayit-line bg-white p-6">
            <h2 className="text-lg font-semibold">Personas y hogares</h2><p className="mt-1 text-xs leading-5 text-bayit-muted">Añade a quién debería incluir la búsqueda. En la versión conectada elegirás perfiles de tus hogares y hogares con los que tengas conexión.</p>
            <div className="mt-4 space-y-2">{participants.map(p=><div key={p.id} className="flex items-center justify-between rounded-xl bg-bayit-cream px-3 py-2 text-sm"><span>{p.name} <span className="text-xs text-bayit-muted">· {p.household}</span></span><button type="button" onClick={()=>setParticipants(list=>list.filter(x=>x.id!==p.id))} className="text-xs underline">Quitar</button></div>)}</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input aria-label="Nombre de la persona" value={personName} onChange={e=>setPersonName(e.target.value)} placeholder="Nombre" className="rounded-xl border border-bayit-line p-3 text-sm"/><input aria-label="Hogar" value={household} onChange={e=>setHousehold(e.target.value)} placeholder="Hogar" className="rounded-xl border border-bayit-line p-3 text-sm"/><button type="button" onClick={()=>{if(personName.trim()&&household.trim()){setParticipants(v=>[...v,{id:crypto.randomUUID(),name:personName.trim(),household:household.trim()}]);setPersonName("");setPrepared(false)}}} className="rounded-full border border-bayit-line px-4 py-2 text-xs">Añadir</button></div>
          </section>
          <section className="rounded-3xl border border-bayit-line bg-white p-6">
            <h2 className="text-lg font-semibold">Condiciones y preferencias</h2>
            <label className="mt-4 block text-xs">¿Qué debemos tener en cuenta?<textarea rows={4} value={constraints} onChange={e=>{setConstraints(e.target.value);setPrepared(false)}} placeholder="Ej. evitar la semana de exámenes, no terminar muy tarde, necesito 30 minutos para desplazarme…" className="mt-2 w-full rounded-xl border border-bayit-line p-3 text-sm"/></label>
            <div className="mt-4 rounded-2xl bg-bayit-cream p-4 text-xs leading-6 text-bayit-muted">Bayit deberá aplicar primero las restricciones inamovibles y los márgenes. Después podrá ordenar las opciones según preferencias. Si alguien no ha actualizado su disponibilidad, aparecerá como “sin información”, nunca como libre.</div>
          </section>
          <button className="w-full rounded-full bg-bayit-brown p-3 text-sm text-white">Guardar borrador de búsqueda</button>
          {prepared&&<p role="status" className="rounded-xl border border-bayit-line bg-white p-4 text-sm leading-6">Borrador guardado en este dispositivo. Todavía no se ha calculado disponibilidad, creado un evento ni enviado invitaciones.</p>}
        </form>
      </div>
    </main>
  );
}
