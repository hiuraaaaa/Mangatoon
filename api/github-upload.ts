
import type { VercelRequest, VercelResponse } from '@vercel/node'

const GH_API = 'https://api.github.com'

async function getShaIfExists(owner:string, repo:string, path:string, branch:string, token:string) {
  const url = `${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } })
  if (r.status === 200) {
    const j:any = await r.json()
    return j.sha as string | undefined
  }
  return undefined // 404 -> not exists
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = process.env.GITHUB_TOKEN
  if (!token) return res.status(500).json({ error: 'Missing server token' })

  try {
    const { owner, repo, branch = 'main', basePath, files, overwrite = true } = req.body || {}
    if (!owner || !repo || !basePath || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Bad payload' })
    }

    const results:any[] = []
    for (const f of files) {
      const { name, contentBase64 } = f || {}
      if (!name || !contentBase64) { results.push({ name, ok:false, status:400, error:'Bad file payload' }); continue }

      const targetPath = `${basePath.replace(/\/+$/,'')}/${name}`

      // optional overwrite: find sha if exists
      let sha: string | undefined = undefined
      if (overwrite) {
        try { sha = await getShaIfExists(owner, repo, targetPath, branch, token) } catch {}
      }

      const url = `${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(targetPath)}`
      const body = { message: `upload ${name} via vercel`, content: contentBase64, branch, ...(sha ? { sha } : {}) }
      const put = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
        body: JSON.stringify(body)
      })

      const text = await put.text()
      let html_url: string | undefined = undefined
      try { html_url = JSON.parse(text)?.content?.html_url } catch {}

      results.push({ name, ok: put.ok, status: put.status, url: html_url, body: text })
    }

    return res.status(200).json({ ok: true, results })
  } catch (e:any) {
    return res.status(500).json({ error: e?.message || 'Upload failed' })
  }
}
