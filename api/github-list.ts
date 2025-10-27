// api/github-list.ts

const GH = 'https://api.github.com'
const RAW = 'https://raw.githubusercontent.com'

// --- helpers ---
async function fetchJSON(url: string, headers?: Record<string, string>) {
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r.json()
}
async function fetchText(url: string, headers?: Record<string, string>) {
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r.text()
}

function extract(j: any, slug?: string) {
  if (!Array.isArray(j?.series)) return { items: [] }

  if (!slug) {
    return { items: j.series.map((s: any) => s.slug).filter(Boolean) }
  }

  const s = j.series.find((x: any) => x.slug === slug)
  if (!s || !Array.isArray(s.chapters)) return { items: [] }

  const ch = s.chapters
    .map((c: any) => Number(c.number))
    .filter((n: any) => Number.isFinite(n))
    .sort((a: number, b: number) => a - b)

  return { items: ch }
}

// --- handler (tanpa @vercel/node) ---
export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const owner = String(req.query.owner || 'hiuraaaaa')
    const repo  = String(req.query.repo  || 'Mangatoon')
    const path  = String(req.query.path  || 'public/manga').replace(/^\/+|\/+$/g, '')
    const slug  = req.query.slug ? String(req.query.slug) : undefined

    // 1) Coba GitHub Contents API untuk list folder
    try {
      const listPath = slug ? `${path}/${slug}` : path
      const url = `${GH}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(listPath)}`
      const arr: any = await fetchJSON(url, { Accept: 'application/vnd.github+json' })

      if (Array.isArray(arr)) {
        if (!slug) {
          const slugs = arr.filter((x: any) => x.type === 'dir').map((x: any) => x.name)
          return res.status(200).json({ items: slugs })
        } else {
          const chapters = arr
            .filter((x: any) => x.type === 'dir')
            .map((x: any) => x.name)
            .filter((n: string) => /^\d+$/.test(n))
            .map((n: string) => Number(n))
            .sort((a: number, b: number) => a - b)
          return res.status(200).json({ items: chapters })
        }
      }
    } catch {
      // lanjut ke fallback
    }

    // 2) Fallback A: public/manga.json dari domain sendiri (jika ada)
    try {
      const host = req.headers.host || ''
      if (host) {
        const j: any = await fetchJSON(`https://${host}/manga.json`)
        return res.status(200).json(extract(j, slug))
      }
    } catch {
      // lanjut fallback berikutnya
    }

    // 3) Fallback B: src/store/manga.json via GitHub API (base64)
    try {
      const j: any = await fetchJSON(
        `${GH}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/src/store/manga.json`,
        { Accept: 'application/vnd.github+json' }
      )
      const buf = (globalThis as any).Buffer
        ? (globalThis as any).Buffer.from(j.content || '', 'base64').toString('utf8')
        : Buffer.from(j.content || '', 'base64').toString('utf8')
      const json = JSON.parse(buf)
      return res.status(200).json(extract(json, slug))
    } catch {
      // lanjut fallback terakhir
    }

    // 4) Fallback C: raw.githubusercontent.com
    try {
      const txt = await fetchText(
        `${RAW}/${owner}/${repo}/main/src/store/manga.json`
      )
      const json = JSON.parse(txt)
      return res.status(200).json(extract(json, slug))
    } catch {}

    // Gagal semua
    return res.status(200).json({ items: [] })
  } catch (e: any) {
    console.error('github-list error:', e)
    return res.status(500).json({ error: e?.message || 'list failed' })
  }
}
