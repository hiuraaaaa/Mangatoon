
import React from 'react'
import data from '../store/manga.json'
export default function Admin(){
  const [json, setJson] = React.useState(JSON.stringify(data,null,2))
  const [msg, setMsg] = React.useState('')
  function download(){
    const blob = new Blob([json], {type:'application/json'})
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'manga.json'; a.click()
    setMsg('Exported manga.json — commit ke repo & redeploy Vercel.')
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if(!f) return; f.text().then(t=> setJson(t))
  }
  return (
    <main className="container-page space-y-3">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <p className="muted">Versi cepat: gunakan field <code>ext</code> per chapter (webp/jpg/png/avif).</p>
      <div className="flex gap-2">
        <button className="btn" onClick={download}>⬇️ Export</button>
        <label className="btn">⬆️ Import<input type="file" accept="application/json" className="hidden" onChange={onFile}/></label>
      </div>
      {msg && <div className="text-green-300">{msg}</div>}
      <textarea value={json} onChange={e=>setJson(e.target.value)} className="w-full h-[520px] bg-[#0f1219] border border-edge rounded-xl p-3 font-mono text-sm"/>
      <p className="muted">Catatan: client-side. Untuk upload gambar & multi-user, butuh backend/storage.</p>
    </main>
  )
}
