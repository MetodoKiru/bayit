"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
  async function signInWithGoogle() {
    setLoading(true); setMessage("");
    try {
      const supabase=createClient();
      const {error}=await supabase.auth.signInWithOAuth({
        provider:"google",
        options:{redirectTo:`${window.location.origin}/auth/callback?next=/app`}
      });
      if(error) throw error;
    } catch(err) {
      setMessage(err instanceof Error ? err.message : "No se ha podido conectar con Google.");
      setLoading(false);
    }
  }
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
      <button type="button" onClick={signInWithGoogle} disabled={loading} className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-bayit-line bg-white px-5 py-3.5 text-sm font-medium text-bayit-brown hover:bg-bayit-cream disabled:opacity-60">
        <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.28 5.65c4.25-3.92 7.5-9.72 7.5-17.3Z"/><path fill="#FBBC05" d="M10.54 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.75-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.98-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.28-5.65c-2.02 1.36-4.6 2.17-8.62 2.17-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
        Continuar con Google
      </button>
      <div className="my-5 flex items-center gap-3 text-xs text-bayit-muted"><span className="h-px flex-1 bg-bayit-line"/><span>o con tu correo</span><span className="h-px flex-1 bg-bayit-line"/></div>
      <form onSubmit={submit} className="mt-0 space-y-5">
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
