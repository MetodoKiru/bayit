"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email,setEmail]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMessage(""); setError("");
    try {
      const supabase=createClient();
      const {error}=await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
      });
      if(error) throw error;
      setMessage("Si existe una cuenta con ese correo, recibirás un enlace para crear una contraseña nueva. Revisa también la carpeta de spam.");
    } catch(err) {
      setError(err instanceof Error ? err.message : "No se ha podido enviar el correo. Inténtalo de nuevo.");
    } finally { setLoading(false); }
  }

  return <main className="grid min-h-screen place-items-center bg-bayit-cream px-5 py-12">
    <div className="w-full max-w-md rounded-[2rem] border border-bayit-line bg-white p-8 shadow-soft sm:p-10">
      <Link href="/" className="text-xl font-semibold tracking-tight text-bayit-brown">bayit</Link>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[.2em] text-bayit-olive">Recuperar acceso</p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight">Vamos a recuperar tu cuenta.</h1>
      <p className="mt-3 text-sm leading-6 text-bayit-muted">Escribe el correo con el que te registraste y te enviaremos un enlace para elegir una contraseña nueva.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block text-sm">Correo electrónico<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white px-4 py-3 outline-none focus:border-bayit-sky"/></label>
        {message&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button disabled={loading} className="w-full rounded-full bg-bayit-brown px-5 py-3.5 text-sm font-medium text-white disabled:opacity-60">{loading?"Enviando…":"Enviar enlace de recuperación"}</button>
      </form>
      <p className="mt-7 text-center text-xs text-bayit-muted"><Link href="/login" className="underline underline-offset-4">Volver a iniciar sesión</Link></p>
    </div>
  </main>;
}
