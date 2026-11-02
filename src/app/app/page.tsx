import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppHome() {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  return <main className="min-h-screen px-5 py-8 sm:px-10">
    <div className="mx-auto max-w-5xl">
      <header className="flex items-center justify-between"><Link href="/" className="text-xl font-semibold">bayit <span className="text-bayit-olive">בית</span></Link><form action="/auth/signout" method="post"><button className="text-sm text-bayit-muted underline">Cerrar sesión</button></form></header>
      <section className="mt-16 rounded-[2rem] border border-bayit-line bg-bayit-paper p-8 shadow-soft sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-bayit-olive">Tu espacio Bayit</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight">Bienvenida a casa.</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-bayit-muted">Tu cuenta ya está autenticada. El siguiente paso será crear tu primer hogar y añadir a sus miembros.</p>
        <div className="mt-8 rounded-2xl bg-bayit-cream p-5"><p className="text-xs text-bayit-muted">CUENTA ACTIVA</p><p className="mt-2 text-sm font-medium">{user.email}</p></div>
        <p className="mt-6 text-xs text-bayit-muted">La creación de hogares se habilitará cuando esté desplegado y verificado el esquema seguro de base de datos.</p>
      </section>
    </div>
  </main>;
}