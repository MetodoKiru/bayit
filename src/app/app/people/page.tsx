"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BAYIT_PALETTE, DEFAULT_PERSON_COLOR } from "@/lib/calendar-palette";

type Family={id:string;name:string};
type Person={id:string;display_name:string;calendar_color:string;auth_user_id:string|null;role:string};
export default function PeoplePage(){
 const supabase=createClient();
 const [families,setFamilies]=useState<Family[]>([]);
 const [familyId,setFamilyId]=useState("");
 const [people,setPeople]=useState<Person[]>([]);
 const [name,setName]=useState("");
 const [relationship,setRelationship]=useState("Familiar");
 const [color,setColor]=useState(DEFAULT_PERSON_COLOR);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{void loadFamilies();},[]);
 async function loadFamilies(){
  const {data,error}=await supabase.from("families").select("id,name").order("name");
  if(error){setMessage("No se han podido cargar los hogares. Comprueba la configuración de Bayit.");return;}
  const rows=(data??[]) as Family[];setFamilies(rows);setFamilyId(rows[0]?.id??"");
 }
 useEffect(()=>{if(familyId)void loadPeople(familyId);else setPeople([]);},[familyId]);
 async function loadPeople(id:string){
  const {data,error}=await supabase.from("family_members").select("role,profile:profiles(id,display_name,calendar_color,auth_user_id)").eq("family_id",id).eq("status","active").order("created_at");
  if(error){setMessage(error.message);return;}
  setPeople((data??[]).map((row:any)=>({...row.profile,role:row.role})).filter((p:any)=>p.id) as Person[]);
 }
 async function add(e:FormEvent){
  e.preventDefault();if(!familyId)return;setBusy(true);setMessage("");
  try{
   const {data:userData,error:userError}=await supabase.auth.getUser();if(userError||!userData.user)throw new Error("Tu sesión ha caducado. Vuelve a iniciar sesión.");
   const {data:myProfile,error:profileError}=await supabase.from("profiles").select("id").eq("auth_user_id",userData.user.id).single();
   if(profileError||!myProfile)throw new Error("No se encuentra tu perfil de Bayit. Revisa la migración de identidades.");
   const {data:profileId,error}=await supabase.rpc("bayit_add_managed_member",{p_family_id:familyId,p_display_name:name,p_color:color});
   if(error)throw error;
   const {error:repError}=await supabase.rpc("bayit_add_profile_representative",{
    p_family_id:familyId,p_managed_profile_id:profileId,p_representative_profile_id:myProfile.id,
    p_can_view_calendar:true,p_can_manage_events:true,p_can_submit_planning:true,
    p_can_manage_tasks:true,p_can_receive_notifications:true
   });
   if(repError)throw new Error("El perfil se ha creado, pero no se pudo asignar la representación: "+repError.message);
   setName("");setRelationship("Familiar");await loadPeople(familyId);
   setMessage("Perfil creado y representación asignada. La relación indicada sirve como referencia visual.");
  }catch(err){setMessage(err instanceof Error?err.message:"No se ha podido crear el perfil.");}
  finally{setBusy(false);}
 }
 return <main className="min-h-screen bg-bayit-cream px-5 py-7 sm:px-10"><div className="mx-auto max-w-5xl">
  <header className="flex items-center justify-between"><Link href="/app" className="text-2xl font-semibold tracking-tight text-bayit-brown">bayit</Link><Link href="/app" className="rounded-full border border-bayit-line bg-white px-4 py-2 text-xs text-bayit-muted">Mi espacio</Link></header>
  <section className="mt-12"><p className="text-[11px] font-semibold uppercase tracking-[.22em] text-bayit-olive">Personas y representación</p><h1 className="mt-2 text-4xl font-medium tracking-tight">Cada persona, a su manera.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-bayit-muted">Crea perfiles para familiares que no necesitan iniciar sesión. Su calendario y su identidad son propios; tú puedes gestionarlos con permisos autorizados.</p></section>
  <section className="mt-8 rounded-3xl border border-bayit-line bg-white p-6"><label className="block text-xs font-medium">Hogar<select value={familyId} onChange={e=>setFamilyId(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white p-3 text-sm">{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>{families.length===0&&<p className="mt-3 text-xs text-bayit-muted">Primero necesitas crear un hogar.</p>}</section>
  <div className="mt-5 grid gap-5 md:grid-cols-[.9fr_1.1fr]">
   <form onSubmit={add} className="rounded-3xl border border-bayit-line bg-white p-6"><h2 className="text-lg font-semibold">Añadir persona</h2><p className="mt-2 text-xs leading-5 text-bayit-muted">No necesita correo, teléfono ni contraseña. Se creará un perfil independiente y se te asignará como representante.</p><label className="mt-5 block text-xs">Nombre<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Abuela" className="mt-2 w-full rounded-xl border border-bayit-line p-3 text-sm"/></label><label className="mt-4 block text-xs">Relación<select value={relationship} onChange={e=>setRelationship(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white p-3 text-sm">{["Familiar","Hijo/a","Abuela/o","Primo/a","Otro"].map(x=><option key={x}>{x}</option>)}</select></label><p className="mt-4 text-xs">Color personal</p><div className="mt-2 flex flex-wrap gap-2">{BAYIT_PALETTE.map(c=><button type="button" key={c.value} title={c.name} aria-label={c.name} onClick={()=>setColor(c.value)} className={`h-8 w-8 rounded-full border-2 ${color===c.value?"border-bayit-brown ring-2 ring-bayit-sand":"border-white"}`} style={{background:c.value}}/>)}</div><button disabled={!familyId||busy} className="mt-6 w-full rounded-full bg-bayit-brown p-3 text-sm text-white disabled:opacity-40">{busy?"Guardando…":"Crear perfil gestionado"}</button></form>
   <section className="rounded-3xl border border-bayit-line bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Personas del hogar</h2><p className="mt-1 text-xs text-bayit-muted">Identidades asociadas a este hogar.</p></div><span className="rounded-full bg-bayit-cream px-3 py-1 text-xs">{people.length}</span></div>{people.length===0?<p className="mt-5 rounded-xl bg-bayit-cream p-4 text-sm text-bayit-muted">Todavía no hay personas en este hogar.</p>:<div className="mt-5 space-y-2">{people.map(p=><article key={p.id} className="flex items-center gap-3 rounded-xl bg-bayit-cream p-3"><span className="grid h-10 w-10 place-items-center rounded-full text-sm font-medium" style={{background:p.calendar_color}}>{p.display_name.slice(0,1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{p.display_name}</p><p className="mt-1 text-xs text-bayit-muted">{p.auth_user_id?"Cuenta propia":"Perfil gestionado"} · {p.role==="owner"?"Propietario":p.role==="admin"?"Administrador":"Miembro"}</p></div></article>)}</div>}<div className="mt-6 rounded-xl border border-bayit-line p-4 text-xs leading-5 text-bayit-muted">Una persona puede pertenecer a varios hogares sin duplicar su identidad. Los permisos de representación se registran por hogar y pueden revocarse por un administrador.</div></section>
  </div>
  {message&&<p role="status" className="mt-5 rounded-xl border border-bayit-line bg-white p-4 text-sm leading-6">{message}</p>}
 </div></main>;
}
