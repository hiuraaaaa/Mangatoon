
import React from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import data from '../store/manga.json'
import { history } from '../utils/store'

export default function Reader(){
  const { slug, chapter } = useParams()
  const [sp, setSp] = useSearchParams()
  const mode = sp.get('mode') || localStorage.getItem('mr.mode') || 'page'
  const setMode = (m:string)=>{ localStorage.setItem('mr.mode', m); sp.set('mode', m); setSp(sp, { replace:true }) }

  const s = data.series.find(x=>x.slug===slug)
  const chNum = Number(chapter)
  const ch:any = s?.chapters.find((c:any)=>c.number===chNum)

  React.useEffect(()=>{
    if(s && ch){
      history.push({ slug:s.slug, title:s.title, cover:s.cover, at: Date.now() })
    }
  },[slug, chapter])

  if(!s || !ch) return <main className="container-page">Not found</main>
  const prev = s.chapters.find((c:any)=>c.number===chNum-1)
  const next = s.chapters.find((c:any)=>c.number===chNum+1)

  const goto = (n:number)=>{ window.location.href = `/manga/${s.slug}/${n}?mode=${mode}` }

  // Version A: use single ext per chapter
  const ext = ch.ext || 'png'

  return (
    <main>
      <div className="sticky top-0 z-20 backdrop-blur bg-bg/80 border-b border-edge">
        <div className="container-page flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <Link className={`btn ${!prev?'opacity-50 pointer-events-none':''}`} to={prev? `/manga/${s.slug}/${prev.number}?mode=${mode}`:'#'}>← Sebelum</Link>
            <Link className="btn" to={`/manga/${s.slug}?mode=${mode}`}>Chapters</Link>
            <Link className={`btn ${!next?'opacity-50 pointer-events-none':''}`} to={next? `/manga/${s.slug}/${next.number}?mode=${mode}`:'#'}>Berikut →</Link>
          </div>
          <div className="flex items-center gap-2">
            <label className="chip">Mode</label>
            <button className={`btn ${mode==='page'?'ring-2 ring-accent':''}`} onClick={()=>setMode('page')}>Halaman</button>
            <button className={`btn ${mode==='webtoon'?'ring-2 ring-accent':''}`} onClick={()=>setMode('webtoon')}>Webtoon</button>
            <select className="btn" defaultValue={ch.number} onChange={(e)=>goto(Number(e.target.value))}>
              {s.chapters.map((c:any)=> <option key={c.number} value={c.number}>Ep {c.number}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={`container-page flex flex-col items-center ${mode==='webtoon' ? 'gap-0' : 'gap-3'}`}>
        {Array.from({length: ch.pages}).map((_,i)=>{
          const n = String(i+1).padStart(3,'0')
          const src = `/manga/${s.slug}/${ch.number}/${n}.${ext}`
          return <img key={n} src={src} alt={`Page ${n}`} loading="lazy"
            className={`w-full ${mode==='webtoon' ? 'max-w-[1200px] rounded-none border-0' : 'max-w-[950px] rounded-lg border border-edge'}`} />
        })}
      </div>
    </main>
  )
}
