const features = [
  { title: "Calendarios que se entienden", text: "Cada persona y cada hogar tiene su color. De un vistazo sabes quién tiene qué plan." },
  { title: "Planes entre hogares", text: "Encuentra momentos para compartir sin exponer la información privada." },
  { title: "Una casa organizada", text: "Coordina las pequeñas tareas del día a día con quienes viven contigo." }
];
const swatches=["#A9C7E8","#C5B8E8","#E9B9C5","#F0C6A8","#E9D99D","#B9C9B1","#A9D3C5"];
export default function Home() {
  return <main className="min-h-screen bg-bayit-cream px-5 py-6 sm:px-10 sm:py-8">
    <nav className="mx-auto flex max-w-6xl items-center justify-between">
      <a href="/" className="text-2xl font-semibold tracking-tight text-bayit-brown">bayit</a>
      <div className="flex items-center gap-3"><a href="/login" className="rounded-full px-4 py-2 text-sm text-bayit-muted hover:bg-white">Iniciar sesión</a><a href="/signup" className="rounded-full bg-bayit-brown px-5 py-2.5 text-sm text-white">Crear cuenta</a></div>
    </nav>
    <section className="mx-auto grid max-w-6xl gap-12 pb-20 pt-16 md:grid-cols-[1.1fr_.9fr] md:items-center md:pt-24">
      <div><p className="mb-5 text-xs font-semibold uppercase tracking-[.22em] text-bayit-olive">Muchos hogares. Una vida compartida.</p>
        <h1 className="max-w-2xl text-5xl font-medium leading-[1.08] tracking-[-.055em] sm:text-7xl">Un mismo plan.<br/><span className="text-[#8796B5]">Cada uno, su color.</span></h1>
        <p className="mt-7 max-w-lg text-base leading-8 text-bayit-muted sm:text-lg">Bayit conecta hogares para organizar calendarios, encuentros y vida cotidiana, con una privacidad que siempre está en tus manos.</p>
        <div className="mt-8 flex flex-wrap gap-2">{swatches.map(c=><span key={c} className="h-3.5 w-9 rounded-full" style={{backgroundColor:c}}/>)}</div>
        <div className="mt-9"><a href="/signup" className="rounded-full bg-bayit-brown px-7 py-3.5 text-sm text-white shadow-soft">Empezar con Bayit</a></div>
      </div>
      <div className="rounded-[2rem] border border-bayit-line bg-white p-5 shadow-soft sm:p-7">
        <div className="flex items-center justify-between border-b border-bayit-line pb-5"><div><p className="text-xs text-bayit-muted">CALENDARIO COMPARTIDO</p><h2 className="mt-1 text-lg font-semibold">Noviembre · Semana 2</h2></div><span className="rounded-full bg-[#F1F3F8] px-3 py-1.5 text-xs text-bayit-muted">Ejemplo</span></div>
        <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs text-bayit-muted">{["L","M","X","J","V","S","D"].map((d,i)=><span key={i}>{d}</span>)}{Array.from({length:14},(_,i)=><span key={i} className={`grid aspect-square place-items-center rounded-xl ${[1,4,7,10,12].includes(i)?"bg-[#F1F3F8] text-bayit-brown":"bg-[#FAFBFD]"}`}>{i+10}</span>)}</div>
        <div className="mt-6 flex flex-wrap gap-3 text-xs">{[["Hogar","#B9C9B1"],["Persona 1","#A9C7E8"],["Persona 2","#E9B9C5"],["Persona 3","#C5B8E8"]].map(([n,c])=><span key={n} className="flex items-center gap-2 rounded-full bg-[#F8F9FC] px-3 py-2"><i className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:c}}/>{n}</span>)}</div>
        <div className="mt-5 space-y-2"><div className="rounded-xl border-l-4 bg-[#F7FAF6] p-3" style={{borderColor:"#B9C9B1"}}><p className="text-[11px] text-bayit-muted">MARTES · 18:00</p><p className="mt-1 text-sm font-medium">Cena en casa</p></div><div className="rounded-xl border-l-4 bg-[#F5F8FC] p-3" style={{borderColor:"#A9C7E8"}}><p className="text-[11px] text-bayit-muted">JUEVES · 17:30</p><p className="mt-1 text-sm font-medium">Clase de música</p></div></div>
        <p className="mt-4 text-center text-[11px] text-bayit-muted">Personas y colores ilustrativos · no son datos reales</p>
      </div>
    </section>
    <section className="mx-auto max-w-6xl border-t border-bayit-line py-12"><p className="text-xs uppercase tracking-[.2em] text-bayit-muted">Todo en su sitio, sin complicaciones</p><div className="mt-7 grid gap-4 md:grid-cols-3">{features.map((f,i)=><article key={f.title} className="rounded-3xl border border-bayit-line bg-white p-6"><p className="text-xs text-bayit-olive">0{i+1}</p><h3 className="mt-5 text-lg font-semibold">{f.title}</h3><p className="mt-3 text-sm leading-7 text-bayit-muted">{f.text}</p></article>)}</div></section>
    <footer className="mx-auto flex max-w-6xl justify-between border-t border-bayit-line py-7 text-xs text-bayit-muted"><span>bayit</span><span>Un espacio para estar más cerca.</span></footer>
  </main>;
}
