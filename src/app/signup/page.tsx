"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMessage("");
    try {
      const supabase=createClient();
      const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name.trim()},emailRedirectTo:`${window.location.origin}/auth/callback?next=/app`}});
      if(error) throw error;
      if(data.session) window.location.assign("/app");
      else setMessage("Te hemos enviado un correo para confirmar tu cuenta. Ábrelo para terminar el registro.");
    } catch(err) { setMessage(err instanceof Error ? err.message : "No se ha podido crear la cuenta."); }
    finally { setLoading(false); }
  }
  return <main className="grid min-h-screen place-items-center bg-bayit-cream px-5 py-12">
    <div className="w-full max-w-md rounded-[2rem] border border-bayit-line bg-white p-8 shadow-soft sm:p-10">
      <Link href="/" className="text-xl font-semibold tracking-tight">bayit</Link>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[.2em] text-bayit-olive">Empieza por ti</p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight">Crea tu cuenta.</h1>
      <p className="mt-3 text-sm leading-6 text-bayit-muted">Una identidad para ti, aunque pertenezcas a varios hogares.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block text-sm">Tu nombre<input required maxLength={80} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white px-4 py-3 outline-none focus:border-bayit-sky"/></label>
        <label className="block text-sm">Correo electrónico<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white px-4 py-3 outline-none focus:border-bayit-sky"/></label>
        <label className="block text-sm">Contraseña<input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white px-4 py-3 outline-none focus:border-bayit-sky"/><span className="mt-1 block text-xs text-bayit-muted">Al menos 8 caracteres.</span></label>
        {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        <button disabled={loading} className="w-full rounded-full bg-bayit-brown px-5 py-3.5 text-sm font-medium text-white disabled:opacity-60">{loading?"Creando cuenta…":"Crear cuenta"}</button>
      </form>
      <p className="mt-7 text-center text-xs text-bayit-muted">¿Ya tienes cuenta? <Link href="/login" className="underline underline-offset-4">Inicia sesión</Link></p>
    </div>
  </main>;
}
