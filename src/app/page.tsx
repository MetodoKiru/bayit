const features = [
  { n: "01", title: "Calendarios conectados", text: "Coordina planes entre hogares sin perder el control de tu privacidad." },
  { n: "02", title: "Eventos compartidos", text: "Encuentra fechas en las que todos podáis estar, con propuestas claras." },
  { n: "03", title: "Organización del hogar", text: "Reparte tareas y responsabilidades dentro de tu propia casa." }
];

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-10 sm:py-8">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <a href="/" className="flex items-center gap-3 text-xl font-semibold tracking-tight">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-bayit-brown text-lg text-bayit-cream">ב</span>
          bayit
        </a>
        <span className="rounded-full border border-bayit-line bg-bayit-paper/70 px-4 py-2 text-xs tracking-wide text-bayit-muted">ESPACIO FAMILIAR PRIVADO</span>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-12 pb-20 pt-20 md:grid-cols-[1.15fr_.85fr] md:items-center md:pt-28">
        <div>
          <p className="mb-6 text-xs font-semibold uppercase tracking-[.24em] text-bayit-olive">Muchos hogares. Una vida compartida.</p>
          <h1 className="max-w-2xl text-5xl font-medium leading-[1.08] tracking-[-.055em] sm:text-7xl">Todo conectado.<br/><span className="text-bayit-olive">Cada hogar, suyo.</span></h1>
          <p className="mt-7 max-w-lg text-base leading-8 text-bayit-muted sm:text-lg">Bayit ayuda a familias y hogares a coordinar calendarios, organizar encuentros y compartir tiempo, respetando siempre la privacidad de cada persona.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-bayit-brown px-6 py-3 text-sm text-bayit-cream">Muy pronto</span>
            <span className="text-sm text-bayit-muted">Un lugar común, con espacio para todos.</span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-bayit-line bg-bayit-paper p-5 shadow-soft sm:p-7">
          <div className="flex items-center justify-between border-b border-bayit-line pb-5">
            <div><p className="text-xs text-bayit-muted">VISTA DE FAMILIA</p><h2 className="mt-1 text-lg font-semibold">Esta semana</h2></div>
            <span className="rounded-full bg-[#EEF0E8] px-3 py-1.5 text-xs text-bayit-olive">Vista privada</span>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs text-bayit-muted">
            {["L","M","X","J","V","S","D"].map((d,i)=><span key={i}>{d}</span>)}
            {Array.from({length:14},(_,i)=><span key={i} className={`grid aspect-square place-items-center rounded-xl ${[2,5,8,11].includes(i)?"bg-bayit-olive text-white":"bg-bayit-cream"}`}>{i+12}</span>)}
          </div>
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-bayit-cream p-4"><p className="text-xs text-bayit-muted">MIÉRCOLES · 18:00</p><p className="mt-1 text-sm font-medium">Cena en familia</p></div>
            <div className="rounded-2xl border border-bayit-line p-4"><p className="text-xs text-bayit-muted">SÁBADO · 12:30</p><p className="mt-1 text-sm font-medium">Comida compartida</p></div>
          </div>
          <p className="mt-4 text-center text-[11px] text-bayit-muted">Ejemplo visual · datos ficticios</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl border-t border-bayit-line py-12">
        <p className="text-xs uppercase tracking-[.2em] text-bayit-muted">Un sistema, tres espacios</p>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {features.map(f=><article key={f.n} className="rounded-3xl border border-bayit-line bg-bayit-paper p-6"><p className="text-xs text-bayit-olive">{f.n}</p><h3 className="mt-5 text-lg font-semibold">{f.title}</h3><p className="mt-3 text-sm leading-7 text-bayit-muted">{f.text}</p></article>)}
        </div>
      </section>
      <footer className="mx-auto flex max-w-6xl justify-between border-t border-bayit-line py-7 text-xs text-bayit-muted"><span>bayit · בית</span><span>Construido para conectar hogares.</span></footer>
    </main>
  );
}