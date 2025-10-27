
import React from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import data from '../store/manga.json'
import { fav } from '../utils/store'
import Pagination from '../components/Pagination'

export default function Series(){
  const { slug } = useParams()
  const [sp, setSp] = useSearchParams()
  const order = (sp.get('order')||'desc') as 'asc'|'desc'
  const page = Number(sp.get('page')||1)
  const perPage = Number(sp.get('perPage')||20)

  const s = data.series.find(x=>x.slug===slug)
  if(!s) return <main className="container-page">Not found</main>

  const [liked, setLiked] = React.useState(fav.has(s.slug))
  const toggle = ()=>{ fav.toggle(s.slug); setLiked(fav.has(s.slug)) }

  const sorted = [...s.chapters].sort((a,b)=> order==='asc' ? a.number-b.number : b.number-a.number)
  const start = (page-1)*perPage
  const view = sorted.slice(start, start+perPage)

  const apply = (params:Record<string,any>)=>{ Object.entries(params).forEach(([k,v])=> sp.set(k,String(v))); setSp(sp,{replace:true}) }

  return (
    <main className="container-page space-y-4">
      <div className="card p-4 grid md:grid-cols-[160px_1fr] gap-4">
        <img src={s.cover} alt={s.title} className="w-40 rounded-lg"/>
        <div>
          <h1 className="text-xl font-bold">{s.title}</h1>
          <div className="muted">{s.tags.join(' • ')}</div>
          <div className="flex gap-2 mt-2">
            {'rating' in s ? <span className="chip">⭐ {s.rating as any}</span> : null}
            {'views' in s ? <span className="chip">👁️ {s.views as any}</span> : null}
            {'likes' in s ? <span className="chip">👍 {s.likes as any}</span> : null}
          </div>
          <div className="mt-3 flex gap-2">
            <Link className="btn" to={`/manga/${s.slug}/${s.chapters[0].number}`}>Baca Sekarang</Link>
            <button onClick={toggle} className="btn">{liked?'❤️ Hapus Favorit':'🤍 Tambah Favorit'}</button>
          </div>
        </div>
      </div>

      <section className="card p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold">Episodes</div>
          <div className="flex gap-2">
            <button className={`btn ${order==='asc'?'ring-2 ring-accent':''}`} onClick={()=>apply({order:'asc', page:1})}>Naik</button>
            <button className={`btn ${order==='desc'?'ring-2 ring-accent':''}`} onClick={()=>apply({order:'desc', page:1})}>Turun</button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {view.map(ch=>(
            <Link key={ch.number} to={`/manga/${s.slug}/${ch.number}`} className="border border-edge rounded-xl p-3 hover:bg-[#141824] transition">
              <div className="font-medium">Episode {ch.number} — {ch.title}</div>
              <div className="muted text-sm">{ch.date || ''} {ch.likes? `• 👍 ${ch.likes}`:''} {ch.comments? `• 💬 ${ch.comments}`:''}</div>
            </Link>
          ))}
        </div>

        <Pagination total={s.chapters.length} page={page} perPage={perPage}
          onPage={(p)=>apply({page:p})} onPerPage={(pp)=>apply({perPage:pp, page:1})} />
      </section>
    </main>
  )
}
