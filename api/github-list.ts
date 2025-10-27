
import type { VercelRequest, VercelResponse } from '@vercel/node'

const GH = 'https://api.github.com'

async function ghGet(url: string, token?: string) {
  const headers: Record<string,string> = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r.json()
}

/**
 * GET /api/github-list?owner=...&repo=...&path=public/manga
 *      (tanpa slug) -> list slug (direktori)
 * GET /api/github-list?owner=...&repo=...&path=public/manga&slug=frieren
 *      -> list chapters (direktori angka) di slug tsb
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    const owner = String(req.query.owner || '')
    const repo  = String(req.query.repo  || '')
    const path  = String(req.query.path  || 'public/manga').replace(/^\/+|\/+$/g,'')
    const slug  = req.query.slug ? String(req.query.slug) : undefined
    if (!owner || !repo) return res.status(400).json({ error: 'owner/repo required' })

    const token = process.env.GITHUB_TOKEN // optional; recommended to avoid rate limit

    const listPath = slug ? `${path}/${slug}` : path
    const url = `${GH}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(listPath)}`
    const json = await ghGet(url, token)

    if (!Array.isArray(json)) return res.status(200).json({ items: [] })

    if (!slug) {
      const slugs = json.filter((x:any)=> x.type==='dir').map((x:any)=> x.name)
      return res.status(200).json({ items: slugs })
    } else {
      const chapters = json
        .filter((x:any)=> x.type==='dir')
        .map((x:any)=> x.name)
        .filter((n:string)=> /^\d+$/.test(n))
        .map((n:string)=> Number(n))
        .sort((a:number,b:number)=> a-b)
      return res.status(200).json({ items: chapters })
    }
  } catch (e:any) {
    return res.status(500).json({ error: e?.message || 'list failed' })
  }
}
