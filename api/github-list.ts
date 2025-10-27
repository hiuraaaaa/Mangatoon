import type { VercelRequest, VercelResponse } from '@vercel/node'

const GH = 'https://api.github.com'

// Fetch helper
async function ghGet(url: string) {
  const r = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r.json()
}

// Fallback: coba baca dari public/manga.json dulu, lalu src/store/manga.json di GitHub
async function fallbackFromPublicOrGit(host: string, owner: string, repo: string, slug?: string) {
  // 1️⃣ Public/manga.json (kalau ada)
  try {
    const url = `https://${host}/manga.json`
    const r = await fetch(url)
    if (r.ok) {
      const j: any = await r.json()
      return extract(j, slug)
    }
  } catch {}

  // 2️⃣ src/store/manga.json dari GitHub (repo publik, nggak perlu token)
  try {
    const url = `${GH}/repos/${owner}/${repo}/contents/src/store/manga.json`
    const r = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
    if (r.ok) {
      const j: any = await r.json()
      const buf = Buffer.from(j.content || '', 'base64').toString('utf8')
      return extract(JSON.parse(buf), slug)
    }
  } catch (err) {
    console.error('Fallback GitHub error', err)
  }

  return { items: [] }
}

// Ekstraksi slug/chapter dari JSON
function extract(j: any, slug?: string) {
  if (!Array.isArray(j?.series)) return { items: [] }

  if (!slug) {
    const slugs = j.series.map((s: any) => s.slug).filter(Boolean)
    return { items: slugs }
  }

  const s = j.series.find((x: any) => x.slug === slug)
  if (!s || !Array.isArray(s.chapters)) return { items: [] }

  const ch = s.chapters
    .map((c: any) => Number(c.number))
    .filter((n: any) => Number.isFinite(n))
    .sort((a: number, b: number) => a - b)

  return { items: ch }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const owner = String(req.query.owner || '')
    const repo = String(req.query.repo || '')
    const path = String(req.query.path || 'public/manga').replace(/^\/+|\/+$/g, '')
    const slug = req.query.slug ? String(req.query.slug) : undefined

    if (!owner || !repo) return res.status(400).json({ error: 'owner/repo required' })

    // 1️⃣ Coba GitHub Contents API
    try {
      const listPath = slug ? `${path}/${slug}` : path
      const url = `${GH}/repos/${owner}/${repo}/contents/${encodeURIComponent(listPath)}`
      const json = await ghGet(url)

      if (Array.isArray(json)) {
        if (!slug) {
          const slugs = json.filter((x: any) => x.type === 'dir').map((x: any) => x.name)
          return res.status(200).json({ items: slugs })
        } else {
          const chapters = json
            .filter((x: any) => x.type === 'dir')
            .map((x: any) => x.name)
            .filter((n: string) => /^\d+$/.test(n))
            .map((n: string) => Number(n))
            .sort((a: number, b: number) => a - b)
          return res.status(200).json({ items: chapters })
        }
      }
    } catch {
      // kalau gagal, lanjut ke fallback
    }

    // 2️⃣ fallback otomatis
    const host = req.headers.host || ''
    const fb = await fallbackFromPublicOrGit(host, owner, repo, slug)
    return res.status(200).json(fb)
  } catch (e: any) {
    console.error('Handler error', e)
    return res.status(500).json({ error: e?.message || 'list failed' })
  }
}
