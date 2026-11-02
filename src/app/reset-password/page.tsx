"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [checking,setChecking]=useState(true);
  const [ready,setReady]=useState(false);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    const supabase=createClient();
    supabase.auth.getUser().then(({data,error})=>{
      setReady(!error && !!data.user);
      if(error || !data.user) setError("El enlace no es válido o ha caducado. Solicita uno nuevo desde «¿Has olvidado tu contraseña?».");
      setChecking(false);
    });
  },[]);

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMessage(""); setError("");
    if(password.length<8){setError("La contraseña debe tener al menos 8 caracteres.");return;}
    if(password!==confirm){setError("Las contraseñas no coinciden.");return;}
    setLoading(true);
    try {
      const supabase=createClient();
      const {error}=await supabase.auth.updateUser({password});
      if(error) throw error;
      setMessage("Tu contraseña se ha actualizado. Ya puedes entrar en Bayit.");
      setReady(false);
    } catch(err) {
      setError(err instanceof Error ? err.message : "No se ha podido actualizar la contraseña. Solicita un enlace nuevo.");
    } finally { setLoading(false); }
  }

  return <main className="grid min-h-screen place-items-center bg-bayit-cream px-5 py-12">
    <div className="w-full max-w-md rounded-[2rem] border border-bayit-line bg-white p-8 shadow-soft sm:p-10">
      <Link href="/" className="text-xl font-semibold tracking-tight text-bayit-brown">bayit</Link>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[.2em] text-bayit-olive">Nueva contraseña</p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight">Ya casi estás dentro.</h1>
      <p className="mt-3 text-sm leading-6 text-bayit-muted">Elige una contraseña nueva para proteger tu cuenta.</p>
      {checking?<p className="mt-8 text-sm text-bayit-muted">Comprobando el enlace…</p>:ready?<form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block text-sm">Nueva contraseña<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white px-4 py-3 outline-none focus:border-bayit-sky"/><span className="mt-1 block text-xs text-bayit-muted">Al menos 8 caracteres.</span></label>
        <label className="block text-sm">Repite la contraseña<input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-2 w-full rounded-xl border border-bayit-line bg-white px-4 py-3 outline-none focus:border-bayit-sky"/></label>
        <button disabled={loading} className="w-full rounded-full bg-bayit-brown px-5 py-3.5 text-sm font-medium text-white disabled:opacity-60">{loading?"Guardando…":"Guardar contraseña nueva"}</button>
      </form>:null}
      {message&&<p role="status" className="mt-6 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error&&<p role="alert" className="mt-6 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <p className="mt-7 text-center text-xs text-bayit-muted"><Link href="/login" className="underline underline-offset-4">Volver a iniciar sesión</Link></p>
    </div>
  </main>;
}
