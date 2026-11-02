"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Family = { id:string; name:string };
type CreatedInvite = { invitation_id:string; invitation_token:string; expires_at:string };

export default function ConnectionsPage(){
  const supabase=createClient();
  const [families,setFamilies]=useState<Family[]>([]);
  const [familyId,setFamilyId]=useState("");
  const [token,setToken]=useState("");
  const [created,setCreated]=useState<CreatedInvite|null>(null);
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);

  useEffect(()=>{void loadFamilies();},[]);
  async function loadFamilies(){
    const {data,error}=await supabase.from("families").select("id,name").order("name");
    if(error){setNotice("No se han podido cargar tus hogares. Comprueba que la base de datos de Bayit esté configurada.");return;}
    const rows=(data??[]) as Family[];
    setFamilies(rows);
    setFamilyId(current=>rows.some(f=>f.id===current)?current:(rows[0]?.id??""));
  }
  async function createInvite(e:FormEvent){
    e.preventDefault();if(!familyId)return;setBusy(true);setNotice("");setCreated(null);
    try{
      const {data,error}=await supabase.rpc("bayit_create_household_invitation",{p_family_id:familyId,p_valid_days:7});
      if(error)throw error;
      const row=Array.isArray(data)?data[0]:data;
      if(!row?.invitation_token)throw new Error("La invitación se creó, pero no se recibió el código.");
      setCreated(row as CreatedInvite);
      setNotice("Invitación real creada. Copia el código ahora: por seguridad no volverá a mostrarse.");
    }catch(err){setNotice(err instanceof Error?err.message:"No se ha podido crear la invitación. Comprueba que las migraciones estén aplicadas.");}
    finally{setBusy(false);}
  }
  async function acceptInvite(e:FormEvent){
    e.preventDefault();if(!familyId||!token.trim())return;setBusy(true);setNotice("");
    try{
      const {error}=await supabase.rpc("bayit_accept_household_invitation",{p_invitation_token:token.trim(),p_target_family_id:familyId});
      if(error)throw error;
      setToken("");setNotice("Conexión creada. No se ha compartido ningún calendario automáticamente; los permisos deberán concederse por separado.");
    }catch(err){setNotice(err instanceof Error?err.message:"No se ha podido aceptar la invitación.");}
    finally{setBusy(false);}
  }
  async function copyToken(){
    if(!created)return;
    try{await navigator.clipboard.writeText(created.invitation_token);setNotice("Código copiado. Envíalo únicamente al administrador del hogar que quieres conectar.");}
    catch{setNotice("Selecciona y copia el código manualmente.");}
  }

  return <main className="min-h-screen bg-bayit-cream px-5 py-7 sm:px-10"><div className="mx-auto max-w-4xl">
    <header className="flex items-center justify-between"><Link href="/app" className="text-2xl font-semibold text-bayit-brown">bayit</Link><Link href="/app" className="rounded-full border border-bayit-line bg-white px-4 py-2 text-xs text-bayit-muted">← Mi espacio</Link></header>
    <section className="mt-12"><p className="text-xs font-semibold uppercase tracking-[.2em] text-bayit-olive">Hogares conectados</p><h1 className="mt-2 text-4xl font-medium">Compartir, a tu manera.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-bayit-muted">Conecta hogares para organizar planes juntos. La invitación requiere aceptación y no comparte datos por defecto.</p></section>
    <section className="mt-8 rounded-3xl border border-bayit-line bg-white p-6">
      <h2 className="text-lg font-semibold">Hogar desde el que actúas</h2>
      {families.length===0?<p className="mt-3 text-sm text-bayit-muted">No se han encontrado hogares. Crea uno primero o inicia sesión.</p>:<select value={familyId} onChange={e=>{setFamilyId(e.target.value);setCreated(null)}} className="mt-3 w-full rounded-xl border border-bayit-line bg-white p-3 text-sm">{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>}
    </section>
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      <form onSubmit={createInvite} className="rounded-3xl border border-bayit-line bg-white p-6"><h2 className="text-lg font-semibold">Invitar a otro hogar</h2><p className="mt-2 text-xs leading-5 text-bayit-muted">Genera un código de un solo uso que caduca en 7 días. Solo se muestra una vez. La persona invitada debe aceptarlo desde su propio hogar.</p><button disabled={!familyId||busy} className="mt-5 w-full rounded-full bg-bayit-brown p-3 text-sm text-white disabled:opacity-40">{busy?"Procesando…":"Crear invitación segura"}</button>
        {created&&<div className="mt-4 rounded-2xl bg-bayit-cream p-4"><p className="text-xs text-bayit-muted">Código de un solo uso</p><p className="mt-2 break-all font-mono text-sm">{created.invitation_token}</p><p className="mt-2 text-xs text-bayit-muted">Caduca: {new Date(created.expires_at).toLocaleString("es-ES")}</p><button type="button" onClick={copyToken} className="mt-3 rounded-full border border-bayit-line bg-white px-4 py-2 text-xs">Copiar código</button></div>}
      </form>
      <form onSubmit={acceptInvite} className="rounded-3xl border border-bayit-line bg-white p-6"><h2 className="text-lg font-semibold">Aceptar una invitación</h2><p className="mt-2 text-xs leading-5 text-bayit-muted">Selecciona arriba el hogar receptor e introduce el código que te ha facilitado el otro administrador.</p><label className="mt-5 block text-xs">Código de invitación<input required value={token} onChange={e=>setToken(e.target.value)} placeholder="Pega aquí el código" className="mt-2 w-full rounded-xl border border-bayit-line p-3 font-mono text-sm"/></label><button disabled={!familyId||busy||!token.trim()} className="mt-5 w-full rounded-full border border-bayit-line p-3 text-sm disabled:opacity-40">Aceptar y conectar hogares</button></form>
    </div>
    <section className="mt-5 rounded-3xl border border-bayit-line bg-white p-6"><h2 className="text-lg font-semibold">Qué significa conectar</h2><div className="mt-4 grid gap-3 text-sm leading-6 text-bayit-muted sm:grid-cols-2"><p>• Aceptar solo crea la conexión entre hogares.</p><p>• No se comparte información automáticamente.</p><p>• Los permisos de calendario se conceden por separado.</p><p>• Las tareas domésticas nunca se comparten.</p><p>• Los permisos podrán revocarse.</p><p>• La disponibilidad desconocida nunca se interpreta como libre.</p></div></section>
    {notice&&<p role="status" className="mt-5 rounded-xl border border-bayit-line bg-white p-4 text-sm leading-6">{notice}</p>}
    <p className="mt-5 text-center text-xs text-bayit-muted">Las invitaciones utilizan funciones seguras del servidor. Los permisos de lectura y compartición siguen cerrados hasta completar las políticas de seguridad.</p>
  </div></main>;
}
