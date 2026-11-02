"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMessage("");
    try {
      const supabase=createClient();
      const {error}=await supabase.auth.signInWithPassword({email,password});
      if(error) throw error;
      window.location.assign("/app");
    } catch(err) { setMessage(err instanceof Error ? err.message : "No se ha podido iniciar sesión."); }
    finally { setLoading(false); }
  }
  return <main className="grid min-h-screen place-items-center bg-bayit-cream px-5 py-12">
    <div className="w-full max-w-md rounded-[2rem] border border-bayit-line bg-white p-8 shadow-soft sm:p-10">
      <Link href="/" className="text-xl font-semibold tracking-tight">bayit</Link>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[.2em] text-bayit-olive">Tu espacio compartido</p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight">Qué alegría verte.</h1>
      <p className="mt-3 text-sm leading-6 text-bayit-muted">Inicia sesión para entrar en tus hogares.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block text-sm">Correo electrónico<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white px-4 py-3 outline-none focus:border-bayit-sky"/></label>
        <label className="block text-sm">Contraseña<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white px-4 py-3 outline-none focus:border-bayit-sky"/></label>
        {message && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}
        <button disabled={loading} className="w-full rounded-full bg-bayit-brown px-5 py-3.5 text-sm font-medium text-white disabled:opacity-60">{loading?"Entrando…":"Iniciar sesión"}</button>
      </form>
      <p className="mt-4 text-center text-xs text-bayit-muted"><Link href="/forgot-password" className="underline underline-offset-4">¿Has olvidado tu contraseña?</Link></p>
      <p className="mt-7 text-center text-xs text-bayit-muted">¿Todavía no tienes cuenta? <Link href="/signup" className="underline underline-offset-4">Crear una cuenta</Link></p>
      <p className="mt-4 text-center text-xs text-bayit-muted"><Link href="/" className="underline underline-offset-4">Volver a Bayit</Link></p>
    </div>
  </main>;
}
