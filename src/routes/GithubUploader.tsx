import React from 'react'

type UploadResult = { name: string; ok: boolean; status: number; url?: string; error?: string }

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export default function GithubUploader() {
  // Repo config
  const [owner, setOwner] = React.useState('hiuraaaaa')
  const [repo, setRepo] = React.useState('Mangatoon')
  const [branch, setBranch] = React.useState('main')

  // Auto list slug & chapter
  const [slugs, setSlugs] = React.useState<string[]>([])
  const [slug, setSlug] = React.useState<string>('')              // dropdown selection
  const [slugInput, setSlugInput] = React.useState('')            // manual new slug
  const [chapters, setChapters] = React.useState<number[]>([])
  const [chapter, setChapter] = React.useState<string>('1')
  const [suggestNext, setSuggestNext] = React.useState(true)

  // Upload state
  const [files, setFiles] = React.useState<FileList | null>(null)
  const [rename, setRename] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [progress, setProgress] = React.useState(0)               // 0..100
  const [results, setResults] = React.useState<UploadResult[]>([])
  const [errors, setErrors] = React.useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  // Derived
  const effectiveSlug = (slug || '').trim() || slugInput.trim()
  const totalCount = files?.length ?? 0
  const okCount = results.filter(r => r.ok).length
  const failCount = results.filter(r => !r.ok).length

  // Helpers
  function pad3(n: number) { return n.toString().padStart(3, '0') }
  function extOf(name: string) { return (name.split('.').pop() || 'jpg').toLowerCase() }

  async function fileToBase64(f: File) {
    const buf = await f.arrayBuffer()
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
  }

  // ==== Auto list data from API ====
  async function loadSlugs() {
    try {
      const p = new URLSearchParams({ owner, repo, path: 'public/manga' })
      const r = await fetch(`/api/github-list?${p.toString()}`)
      const j = await r.json()
      if (Array.isArray(j.items)) setSlugs(j.items)
    } catch (e) {
      setErrors(prev => [...prev, 'Gagal mengambil daftar seri dari GitHub.'])
    }
  }

  async function loadChapters(theSlug: string) {
    try {
      const p = new URLSearchParams({ owner, repo, path: 'public/manga', slug: theSlug })
      const r = await fetch(`/api/github-list?${p.toString()}`)
      const j = await r.json()
      if (Array.isArray(j.items)) setChapters(j.items as number[])
    } catch (e) {
      setErrors(prev => [...prev, `Gagal mengambil daftar chapter untuk ${theSlug}.`])
    }
  }

  React.useEffect(() => { loadSlugs() }, [owner, repo])
  React.useEffect(() => { if (slug) loadChapters(slug); else setChapters([]) }, [slug])
  React.useEffect(() => {
    if (suggestNext) {
      const next = (chapters[chapters.length - 1] || 0) + 1
      setChapter(String(next))
    }
  }, [chapters, suggestNext])

  // ==== Drag & Drop ====
  const dropRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    const el = dropRef.current
    if (!el) return
    const onPrevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation() }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      const dt = e.dataTransfer
      if (!dt) return
      const fl = dt.files
      if (!fl?.length) return
      // Merge: replace current selection
      setFiles(fl)
    }
    ;['dragenter','dragover','dragleave','drop'].forEach(ev => el.addEventListener(ev, onPrevent))
    el.addEventListener('drop', onDrop)
    return () => {
      ;['dragenter','dragover','dragleave','drop'].forEach(ev => el.removeEventListener(ev, onPrevent))
      el.removeEventListener('drop', onDrop)
    }
  }, [])

  // ==== Validation ====
  function validateSelection(): string[] {
    const errs: string[] = []
    if (!effectiveSlug) errs.push('Isi atau pilih slug terlebih dahulu.')
    if (!chapter || !/^\d+$/.test(chapter)) errs.push('Chapter harus angka (contoh: 1, 2, 3).')
    if (!files || files.length === 0) errs.push('Pilih minimal satu file untuk diupload.')
    if (files) {
      for (const f of Array.from(files)) {
        if (!ACCEPTED.includes(f.type)) {
          errs.push(`Tipe file tidak didukung: ${f.name} (${f.type || 'unknown'})`)
        }
        if (f.size > 25 * 1024 * 1024) {
          errs.push(`File terlalu besar (>25MB): ${f.name}`)
        }
      }
    }
    return errs
  }

  // ==== API call per-file (aman dari limit payload) ====
  async function uploadOne(basePath: string, name: string, b64: string) {
    const r = await fetch('/api/github-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner, repo, branch,
        basePath,
        files: [{ name, contentBase64: b64 }],
        overwrite: true
      })
    })
    const j = await r.json().catch(() => ({}))
    const item = Array.isArray(j.results) ? j.results[0] : null
    const ok = r.ok && item && item.status >= 200 && item.status < 300
    return {
      ok,
      status: item?.status ?? r.status,
      url: item?.url,
      error: item?.body || j?.error || 'unknown'
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors([])
    setResults([])
    const errs = validateSelection()
    if (errs.length) { setErrors(errs); return }

    const basePath = `public/manga/${effectiveSlug}/${chapter}`
    const list = Array.from(files!).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    )

    setBusy(true)
    setProgress(0)

    let done = 0
    for (let i = 0; i < list.length; i++) {
      const f = list[i]
      const name = rename ? `${pad3(i + 1)}.${extOf(f.name)}` : f.name
      const b64 = await fileToBase64(f)
      const resp = await uploadOne(basePath, name, b64)

      setResults(prev => [...prev, { name, ok: resp.ok, status: resp.status, url: resp.url, error: resp.error }])
      done++
      setProgress(Math.round((done / list.length) * 100))
    }

    setBusy(false)
  }

  // ==== UI ====
  return (
    <main className="container-page max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">GitHub Uploader</h1>
        <div className="text-xs text-zinc-400">
          {okCount + failCount > 0 ? (
            <span>
              Selesai: <span className="text-green-400">{okCount} OK</span> ·{' '}
              <span className="text-red-400">{failCount} gagal</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm space-y-1">
          <div className="font-semibold">Ada yang perlu dicek:</div>
          <ul className="list-disc pl-5">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-5">
        {/* Slug & chapter */}
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-1">
            <div className="text-sm font-medium">Pilih seri (slug)</div>
            <select className="input" value={slug} onChange={e => setSlug(e.target.value)}>
              <option value="">— Ketik manual di kanan —</option>
              {slugs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="text-xs text-zinc-400">Sumber: folder <code>public/manga</code> di GitHub.</div>
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Atau slug baru</div>
            <input className="input" placeholder="contoh: boss-sombong"
                   value={slugInput} onChange={e => setSlugInput(e.target.value)} />
            <div className="text-xs text-zinc-400">Jika diisi, ini yang dipakai.</div>
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-1">
            <div className="text-sm font-medium">Chapter (angka)</div>
            <input className="input" value={chapter} onChange={e => setChapter(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 pt-6">
            <input type="checkbox" checked={suggestNext} onChange={e => setSuggestNext(e.target.checked)} />
            <span className="text-sm">Auto saran chapter berikutnya</span>
          </label>
        </div>

        {/* Dropzone */}
        <div ref={dropRef}
             className="rounded-xl border-2 border-dashed border-white/15 p-6 text-center bg-white/5 hover:bg-white/10 transition">
          <div className="font-medium">Tarik & lepas gambar ke sini</div>
          <div className="text-xs text-zinc-400 mt-1">atau</div>
          <div className="mt-3">
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.avif"
              onChange={e => setFiles(e.target.files)}
            />
          </div>
          {files && files.length > 0 && (
            <div className="text-xs text-zinc-400 mt-3">
              {files.length} file dipilih
            </div>
          )}
        </div>

        {/* Options */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={rename} onChange={e => setRename(e.target.checked)} />
            <span>Rename berurutan <span className="text-zinc-400">(001.ext, 002.ext, ...)</span></span>
          </label>

          <button
            type="button"
            className="text-xs underline"
            onClick={() => setShowAdvanced(s => !s)}
          >
            {showAdvanced ? 'Sembunyikan Advanced' : 'Tampilkan Advanced'}
          </button>
        </div>

        {/* Advanced */}
        {showAdvanced && (
          <div className="grid sm:grid-cols-3 gap-3 rounded-lg p-3 bg-white/5 border border-white/10">
            <label className="space-y-1">
              <div className="text-sm">Owner</div>
              <input className="input" value={owner} onChange={e => setOwner(e.target.value)} />
            </label>
            <label className="space-y-1">
              <div className="text-sm">Repo</div>
              <input className="input" value={repo} onChange={e => setRepo(e.target.value)} />
            </label>
            <label className="space-y-1">
              <div className="text-sm">Branch</div>
              <input className="input" value={branch} onChange={e => setBranch(e.target.value)} />
            </label>
          </div>
        )}

        {/* Progress */}
        {busy && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Uploading…</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded bg-white/10 overflow-hidden">
              <div className="h-2 bg-white/70" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button className="btn" disabled={busy} type="submit">
            {busy ? 'Uploading…' : 'Upload ke GitHub'}
          </button>
          {totalCount > 0 && !busy && (
            <div className="text-xs text-zinc-400">{totalCount} file siap diunggah</div>
          )}
        </div>
      </form>

      {/* Results */}
      {results.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
          <div className="font-semibold">Hasil Upload</div>
          <ul className="divide-y divide-white/10">
            {results.map((r, i) => (
              <li key={i} className="py-2 text-sm flex items-center gap-3">
                <span className={r.ok ? 'text-green-400' : 'text-red-400'}>
                  {r.ok ? '✅' : '❌'}
                </span>
                <span className="truncate">{r.name}</span>
                <span className="text-xs text-zinc-400">— {r.status}</span>
                {r.url ? (
                  <a className="ml-auto underline text-xs" href={r.url} target="_blank" rel="noreferrer">open</a>
                ) : (
                  r.error ? <span className="ml-auto text-xs text-zinc-400 truncate max-w-[40%]">{r.error}</span> : null
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
      }
