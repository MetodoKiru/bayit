"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BAYIT_PALETTE, DEFAULT_FAMILY_COLOR, DEFAULT_PERSON_COLOR } from "@/lib/calendar-palette";

type Family={id:string;name:string;calendar_color:string;created_at:string};
type Member={id:string;role:string;profile:{id:string;display_name:string;calendar_color:string}|null};

export default function HouseholdDashboard({email}:{email:string}) {
  const [families,setFamilies]=useState<Family[]>([]);
  const [members,setMembers]=useState<Member[]>([]);
  const [selected,setSelected]=useState("");
  const [familyName,setFamilyName]=useState("");
  const [memberName,setMemberName]=useState("");
  const [familyColor,setFamilyColor]=useState(DEFAULT_FAMILY_COLOR);
  const [memberColor,setMemberColor]=useState(DEFAULT_PERSON_COLOR);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const supabase=createClient();

  async function loadFamilies() {
    const {data,error}=await supabase.from("families").select("id,name,calendar_color,created_at").order("created_at",{ascending:true});
    if(error){setMessage(error.message);setLoading(false);return;}
    const rows=(data??[]) as Family[];
    setFamilies(rows);
    setSelected(current=>rows.some(f=>f.id===current)?current:(rows[0]?.id??""));
    setLoading(false);
  }
  async function loadMembers(familyId:string) {
    if(!familyId){setMembers([]);return;}
    const {data,error}=await supabase.from("family_members").select("id,role,profile:profiles!family_members_profile_id_fkey(id,display_name,calendar_color)").eq("family_id",familyId).eq("status","active").order("created_at");
    if(error){setMessage(error.message);return;}
    setMembers((data??[]) as unknown as Member[]);
  }
  useEffect(()=>{void loadFamilies();},[]);
  useEffect(()=>{void loadMembers(selected);},[selected]);
  const activeFamily=families.find(f=>f.id===selected);

  async function createFamily(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setBusy(true);setMessage("");
    try {
      const {data,error}=await supabase.rpc("bayit_create_family",{p_name:familyName,p_color:familyColor});
      if(error)throw error;
      setFamilyName("");await loadFamilies();if(data)setSelected(data as string);
      setMessage("Tu hogar ya está creado.");
    } catch(err){setMessage(err instanceof Error?err.message:"No se ha podido crear el hogar.");}
    finally{setBusy(false);}
  }
  async function addMember(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();if(!selected)return;setBusy(true);setMessage("");
    try {
      const {error}=await supabase.rpc("bayit_add_managed_member",{p_family_id:selected,p_display_name:memberName,p_color:memberColor});
      if(error)throw error;
      setMemberName("");await loadMembers(selected);setMessage("Miembro añadido al hogar.");
    } catch(err){setMessage(err instanceof Error?err.message:"No se ha podido añadir el miembro.");}
    finally{setBusy(false);}
  }

  return <main className="min-h-screen bg-bayit-cream px-5 py-7 sm:px-10">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-2xl font-semibold tracking-tight text-bayit-brown">bayit</Link>
        <div className="flex items-center gap-4"><span className="hidden text-xs text-bayit-muted sm:inline">{email}</span><form action="/auth/signout" method="post"><button className="rounded-full border border-bayit-line bg-white px-4 py-2 text-xs text-bayit-muted">Cerrar sesión</button></form></div>
      </header>
      <nav className="mt-7 flex flex-wrap gap-2"><Link href="/app/calendar" className="rounded-full border border-bayit-line bg-white px-4 py-2 text-xs">Calendario</Link><Link href="/app/planning" className="rounded-full border border-bayit-line bg-white px-4 py-2 text-xs">Planificar mi mes</Link><Link href="/app/connections" className="rounded-full border border-bayit-line bg-white px-4 py-2 text-xs">Conectar hogares</Link><Link href="/app/organize" className="rounded-full border border-bayit-line bg-white px-4 py-2 text-xs">Organizar evento</Link><Link href="/app/tasks" className="rounded-full border border-bayit-line bg-white px-4 py-2 text-xs">Tareas de casa</Link><Link href="/app/quick-add" className="rounded-full bg-bayit-brown px-4 py-2 text-xs text-white">+ Añadir plan</Link><Link href="/app/people" className="rounded-full border border-bayit-line bg-white px-4 py-2 text-xs">Personas</Link></nav><section className="pt-12"><p className="text-xs font-semibold uppercase tracking-[.2em] text-bayit-olive">Tu espacio Bayit</p><h1 className="mt-3 text-4xl font-medium tracking-tight">Bienvenida a casa.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-bayit-muted">Cada hogar tiene su color. Las personas también. Así podrás reconocer tus calendarios de un vistazo.</p></section>
      {message&&<p role="status" className="mt-6 rounded-2xl border border-bayit-line bg-white px-4 py-3 text-sm text-bayit-brown">{message}</p>}
      <div className="mt-8 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-bayit-line bg-white p-6 shadow-soft sm:p-8">
          <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-bayit-muted">Mis hogares</p><h2 className="mt-1 text-xl font-semibold">Tu familia</h2></div><span className="rounded-full bg-bayit-cream px-3 py-1 text-xs text-bayit-muted">{families.length}</span></div>
          {loading?<p className="mt-6 text-sm text-bayit-muted">Cargando tus hogares…</p>:families.length===0?<p className="mt-6 rounded-2xl bg-bayit-cream p-5 text-sm leading-6 text-bayit-muted">Todavía no tienes ningún hogar. Crea el primero para empezar a organizaros.</p>:<div className="mt-5 space-y-2">{families.map(f=><button key={f.id} onClick={()=>setSelected(f.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${selected===f.id?"border-bayit-sky bg-[#F7F9FD]":"border-bayit-line hover:bg-bayit-cream"}`}><span className="h-3.5 w-3.5 rounded-full" style={{background:f.calendar_color}}/><span className="min-w-0 flex-1 text-sm font-medium">{f.name}</span><span className="text-xs text-bayit-muted">{selected===f.id?"Seleccionado":"Ver hogar"}</span></button>)}</div>}
          <form onSubmit={createFamily} className="mt-7 border-t border-bayit-line pt-6"><h3 className="text-sm font-semibold">Crear un hogar</h3><label className="mt-4 block text-xs text-bayit-muted">Nombre del hogar<input required maxLength={80} value={familyName} onChange={e=>setFamilyName(e.target.value)} placeholder="Ej. Casa de Madrid" className="mt-2 w-full rounded-xl border border-bayit-line px-4 py-3 text-sm outline-none focus:border-bayit-sky"/></label><p className="mt-4 text-xs text-bayit-muted">Color del calendario familiar</p><div className="mt-2 flex flex-wrap gap-2">{BAYIT_PALETTE.map(c=><button type="button" key={c.value} title={c.name} aria-label={c.name} onClick={()=>setFamilyColor(c.value)} className={`h-8 w-8 rounded-full border-2 ${familyColor===c.value?"border-bayit-brown ring-2 ring-bayit-sand":"border-white"}`} style={{background:c.value}}/>)}</div><button disabled={busy} className="mt-5 w-full rounded-full bg-bayit-brown px-5 py-3 text-sm text-white disabled:opacity-50">{busy?"Guardando…":"Crear hogar"}</button></form>
        </section>
        <section className="rounded-[2rem] border border-bayit-line bg-white p-6 shadow-soft sm:p-8">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-bayit-muted">Personas</p><h2 className="mt-1 text-xl font-semibold">{activeFamily?.name??"Miembros del hogar"}</h2></div>{activeFamily&&<span className="h-4 w-4 rounded-full" style={{background:activeFamily.calendar_color}}/>}</div>
          {!activeFamily?<p className="mt-6 rounded-2xl bg-bayit-cream p-5 text-sm leading-6 text-bayit-muted">Cuando crees tu primer hogar, podrás añadir aquí a las personas que forman parte de él.</p>:<>
            <div className="mt-5 space-y-3">{members.map(m=><div key={m.id} className="flex items-center gap-3 rounded-2xl bg-bayit-cream p-4"><span className="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold text-bayit-brown" style={{background:m.profile?.calendar_color??DEFAULT_PERSON_COLOR}}>{m.profile?.display_name?.slice(0,1).toUpperCase()??"?"}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{m.profile?.display_name??"Miembro"}</p><p className="mt-1 text-xs capitalize text-bayit-muted">{m.role==="owner"?"Propietario":m.role==="admin"?"Administrador":"Miembro"}</p></div></div>)}</div>
            <form onSubmit={addMember} className="mt-7 border-t border-bayit-line pt-6"><h3 className="text-sm font-semibold">Añadir una persona</h3><p className="mt-1 text-xs leading-5 text-bayit-muted">Puedes crear un perfil gestionado para alguien que todavía no tenga cuenta. Más adelante podrá reclamarlo.</p><label className="mt-4 block text-xs text-bayit-muted">Nombre<input required maxLength={80} value={memberName} onChange={e=>setMemberName(e.target.value)} placeholder="Nombre de la persona" className="mt-2 w-full rounded-xl border border-bayit-line px-4 py-3 text-sm outline-none focus:border-bayit-sky"/></label><p className="mt-4 text-xs text-bayit-muted">Color personal del calendario</p><div className="mt-2 flex flex-wrap gap-2">{BAYIT_PALETTE.map(c=><button type="button" key={c.value} title={c.name} aria-label={c.name} onClick={()=>setMemberColor(c.value)} className={`h-8 w-8 rounded-full border-2 ${memberColor===c.value?"border-bayit-brown ring-2 ring-bayit-sand":"border-white"}`} style={{background:c.value}}/>)}</div><button disabled={busy} className="mt-5 w-full rounded-full border border-bayit-line bg-white px-5 py-3 text-sm text-bayit-brown hover:bg-bayit-cream disabled:opacity-50">{busy?"Guardando…":"Añadir miembro"}</button></form>
          </>}
        </section>
      </div>
      <p className="mt-8 text-center text-xs text-bayit-muted">Los hogares y sus miembros son privados. Compartir con otros hogares será una decisión independiente.</p>
    </div>
  </main>;
}
