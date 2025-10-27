
import React from 'react'

type R = { name:string; ok:boolean; status:number; url?:string; error?:string }

export default function GithubUploader(){
  const [owner, setOwner]   = React.useState('hiuraaaaa')
  const [repo, setRepo]     = React.useState('Mangatoon')
  const [branch, setBranch] = React.useState('main')

  // Auto list
  const [slugs, setSlugs] = React.useState<string[]>([])
  const [slug, setSlug]   = React.useState<string>('')          // selected from dropdown
  const [slugInput, setSlugInput] = React.useState('')          // manual new slug
  const [chapters, setChapters] = React.useState<number[]>([])
  const [chapter, setChapter]   = React.useState<string>('1')
  const [suggestNext, setSuggestNext] = React.useState(true)

  // Upload controls
  const [rename, setRename] = React.useState(true)
  const [files, setFiles]   = React.useState<FileList | null>(null)
  const [busy, setBusy]     = React.useState(false)
  const [results, setResults] = React.useState<R[]>([])

  function pad3(n:number){ return n.toString().padStart(3,'0') }
  function extOf(name:string){ const e = name.split('.').pop()?.toLowerCase() || 'jpg'; return e }

  async function f2b64(f:File):Promise<string>{ const buf = await f.arrayBuffer(); return btoa(String.fromCharCode(...new Uint8Array(buf))) }

  // list slugs
  async function loadSlugs() {
    const p = new URLSearchParams({ owner, repo, path: 'public/manga' })
    const r = await fetch(`/api/github-list?${p.toString()}`)
    const j = await r.json()
    if (Array.isArray(j.items)) setSlugs(j.items)
  }

  // list chapters
  async function loadChapters(theSlug: string) {
    const p = new URLSearchParams({ owner, repo, path: 'public/manga', slug: theSlug })
    const r = await fetch(`/api/github-list?${p.toString()}`)
    const j = await r.json()
    if (Array.isArray(j.items)) setChapters(j.items as number[])
  }

  React.useEffect(()=>{ loadSlugs().catch(()=>{}) }, [owner, repo])

  React.useEffect(()=>{
    if (slug) { loadChapters(slug).catch(()=>{}) } else { setChapters([]) }
  }, [slug])

  React.useEffect(()=>{
    if (suggestNext) {
      const next = (chapters[chapters.length-1] || 0) + 1
      setChapter(String(next))
    }
  }, [chapters, suggestNext])

  const effectiveSlug = (slug || '').trim() || slugInput.trim()

  async function onSubmit(e:React.FormEvent){
    e.preventDefault()
    if (!files) { alert('Pilih file dulu'); return }
    if (!effectiveSlug) { alert('Isi slug atau pilih dari dropdown'); return }
    if (!chapter || !/^\d+$/.test(chapter)) { alert('Chapter harus angka'); return }
    setBusy(true); setResults([])

    const basePath = `public/manga/${effectiveSlug}/${chapter}`
    const sorted = Array.from(files).sort((a,b)=> a.name.localeCompare(b.name, undefined, {numeric:true, sensitivity:'base'}))

    const payloadFiles = []
    for (let i=0; i<sorted.length; i++){
      const f = sorted[i]
      const name = rename ? `${pad3(i+1)}.${extOf(f.name)}` : f.name
      const contentBase64 = await f2b64(f)
      payloadFiles.push({ name, contentBase64 })
    }

    const r = await fetch('/api/github-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, repo, branch, basePath, files: payloadFiles, overwrite: true })
    })
    const j = await r.json()
    const out: R[] = (j.results || []).map((x:any)=>({
      name: x.name, ok: !!x.ok || (x.status>=200 && x.status<300), status: x.status, url: x.url, error: x.body
    }))
    setResults(out); setBusy(false)
  }

  return (
    <main className="container-page max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">GitHub Uploader</h1>
      <form onSubmit={onSubmit} className="card p-4 space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="space-y-1"><div className="text-sm">Owner</div><input className="input" value={owner} onChange={e=>setOwner(e.target.value)} /></label>
          <label className="space-y-1"><div className="text-sm">Repo</div><input className="input" value={repo} onChange={e=>setRepo(e.target.value)} /></label>
          <label className="space-y-1"><div className="text-sm">Branch</div><input className="input" value={branch} onChange={e=>setBranch(e.target.value)} /></label>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="space-y-1">
            <div className="text-sm">Pilih seri (slug)</div>
            <select className="input" value={slug} onChange={e=>setSlug(e.target.value)}>
              <option value="">— Ketik manual di kanan —</option>
              {slugs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="muted text-xs">Daftar berasal dari folder <code>public/manga</code> di GitHub.</div>
          </label>

          <label className="space-y-1">
            <div className="text-sm">Atau slug baru</div>
            <input className="input" placeholder="contoh: boss-sombong" value={slugInput} onChange={e=>setSlugInput(e.target.value)} />
            <div className="muted text-xs">Jika diisi, ini yang dipakai.</div>
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="space-y-1"><div className="text-sm">Chapter</div><input className="input" value={chapter} onChange={e=>setChapter(e.target.value)} /></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={suggestNext} onChange={e=>setSuggestNext(e.target.checked)} /><span className="text-sm">Auto saran chapter berikutnya</span></label>
        </div>

        <label className="space-y-1 block"><div className="text-sm">Pilih file (banyak)</div><input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.avif" onChange={e=>setFiles(e.target.files)} /></label>

        <label className="flex items-center gap-2"><input type="checkbox" checked={rename} onChange={e=>setRename(e.target.checked)} /><span>Rename berurutan (001.ext, 002.ext, ...)</span></label>

        <button className="btn" disabled={busy} type="submit">{busy ? 'Uploading...' : 'Upload ke GitHub'}</button>
      </form>

      {results.length>0 && (
        <div className="card p-3 space-y-2">
          <div className="font-semibold">Hasil</div>
          <ul className="space-y-1 text-sm">
            {results.map((r,i)=>(
              <li key={i} className={r.ok ? 'text-green-400' : 'text-red-400'}>
                {r.ok ? '✅' : '❌'} {r.name} — {r.status} {r.url ? (<a className="underline" href={r.url} target="_blank" rel="noreferrer">open</a>) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
}
